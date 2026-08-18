import type { NextRequest } from "next/server";

import { AuthChallengeType, Prisma } from "@/generated/prisma/client";

import { changeEmailRequestSchema } from "@/features/auth/change-email/model/changeEmailRequestSchema";
import { isAppLocale, routing } from "@/i18n/routing";
import { EMAIL_VERIFICATION_TTL_MS } from "@/shared/config/auth";
import { createAuthToken } from "@/shared/lib/authToken";
import { sendEmailVerificationEmail } from "@/shared/lib/email";
import {
  MAX_AUTH_JSON_BODY_BYTES,
  createNoStoreJsonResponse as jsonResponse,
  isJsonRequest,
  isTrustedOrigin,
  readLimitedJsonBody,
} from "@/shared/lib/http";
import { getPrisma } from "@/shared/lib/prisma";
import { getCurrentSession } from "@/shared/lib/session";

import { CHANGE_EMAIL_POLICY } from "./constants";

export const runtime = "nodejs";

class EmailChangeConflictError extends Error {
  constructor() {
    super("The email changed while the request was in progress");
    this.name = "EmailChangeConflictError";
  }
}

class EmailChangeUnauthorizedError extends Error {
  constructor() {
    super("The session expired while the email change was in progress");
    this.name = "EmailChangeUnauthorizedError";
  }
}

class EmailAlreadyVerifiedError extends Error {
  constructor() {
    super("The email was verified while the change was in progress");
    this.name = "EmailAlreadyVerifiedError";
  }
}

function getRetryAfterSeconds(
  startedAt: Date,
  durationMs: number,
  now: Date,
): number {
  return Math.max(
    0,
    Math.ceil((startedAt.getTime() + durationMs - now.getTime()) / 1000),
  );
}

async function revokeStagedChallenge(
  challengeId: string,
  context: string,
): Promise<void> {
  try {
    await getPrisma().authChallenge.updateMany({
      where: {
        id: challengeId,
        type: AuthChallengeType.EMAIL_CHANGE,
        consumedAt: null,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Failed to clean up ${context} email change:`, error);
  }
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return jsonResponse(
      {
        code: "INVALID_ORIGIN",
      },
      403,
    );
  }

  if (!isJsonRequest(request)) {
    return jsonResponse(
      {
        code: "UNSUPPORTED_MEDIA_TYPE",
      },
      415,
    );
  }

  let bodyResult: Awaited<ReturnType<typeof readLimitedJsonBody>>;

  try {
    bodyResult = await readLimitedJsonBody(
      request,
      MAX_AUTH_JSON_BODY_BYTES,
    );
  } catch (error) {
    console.error("Reading email change request body failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }

  if (!bodyResult.ok) {
    return jsonResponse(
      {
        code: bodyResult.code,
      },
      bodyResult.code === "PAYLOAD_TOO_LARGE" ? 413 : 400,
    );
  }

  const validationResult = changeEmailRequestSchema.safeParse(bodyResult.body);

  if (!validationResult.success) {
    return jsonResponse(
      {
        code: "VALIDATION_ERROR",

        issues: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          code: issue.message,
        })),
      },
      400,
    );
  }

  let session: Awaited<ReturnType<typeof getCurrentSession>>;

  try {
    session = await getCurrentSession(request);
  } catch (error) {
    console.error("Getting session for email change failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }

  if (!session) {
    return jsonResponse(
      {
        code: "UNAUTHORIZED",
      },
      401,
    );
  }

  const { email: newEmail, locale: requestedLocale } = validationResult.data;
  const emailLocale =
    typeof requestedLocale === "string" && isAppLocale(requestedLocale)
      ? requestedLocale
      : routing.defaultLocale;

  const prisma = getPrisma();
  let stagedChallengeId: string | undefined;

  try {
    const stageResult = await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${session.user.id}::uuid
        FOR UPDATE
      `;

      const user = await transaction.user.findUnique({
        where: {
          id: session.user.id,
        },

        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
        },
      });

      if (!user) {
        return {
          status: "UNAUTHORIZED",
        } as const;
      }

      if (user.emailVerifiedAt) {
        return {
          status: "EMAIL_ALREADY_VERIFIED",
        } as const;
      }

      if (user.email === newEmail) {
        return {
          status: "EMAIL_UNCHANGED",
        } as const;
      }

      const now = new Date();

      await transaction.authChallenge.updateMany({
        where: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_CHANGE,
          consumedAt: null,
          revokedAt: null,

          expiresAt: {
            lte: now,
          },
        },

        data: {
          revokedAt: now,
        },
      });

      const activeStage = await transaction.authChallenge.findFirst({
        where: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_CHANGE,
          consumedAt: null,
          revokedAt: null,
        },

        select: {
          expiresAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      if (activeStage) {
        return {
          status: "RATE_LIMITED",
          retryAfterSeconds: Math.max(
            1,
            Math.ceil(
              (activeStage.expiresAt.getTime() - now.getTime()) / 1000,
            ),
          ),
        } as const;
      }

      const changeWindowStart = new Date(
        now.getTime() - CHANGE_EMAIL_POLICY.windowMs,
      );

      const recentChanges = await transaction.authChallenge.findMany({
        where: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_CHANGE,

          createdAt: {
            gte: changeWindowStart,
          },
        },

        select: {
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: CHANGE_EMAIL_POLICY.limitPerWindow,
      });

      const latestChangeAt = recentChanges[0]?.createdAt;

      if (latestChangeAt) {
        const cooldownRetryAfterSeconds = getRetryAfterSeconds(
          latestChangeAt,
          CHANGE_EMAIL_POLICY.cooldownMs,
          now,
        );

        if (cooldownRetryAfterSeconds > 0) {
          return {
            status: "RATE_LIMITED",
            retryAfterSeconds: cooldownRetryAfterSeconds,
          } as const;
        }
      }

      if (recentChanges.length >= CHANGE_EMAIL_POLICY.limitPerWindow) {
        const oldestChangeAt =
          recentChanges[recentChanges.length - 1]?.createdAt;

        if (oldestChangeAt) {
          const limitRetryAfterSeconds = getRetryAfterSeconds(
            oldestChangeAt,
            CHANGE_EMAIL_POLICY.windowMs,
            now,
          );

          if (limitRetryAfterSeconds > 0) {
            return {
              status: "RATE_LIMITED",
              retryAfterSeconds: limitRetryAfterSeconds,
            } as const;
          }
        }
      }

      const { token: verificationToken, tokenHash } = createAuthToken();
      const stageExpiresAt = new Date(
        now.getTime() + CHANGE_EMAIL_POLICY.stageTtlMs,
      );

      const stagedChallenge = await transaction.authChallenge.create({
        data: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_CHANGE,
          secretHash: tokenHash,
          target: newEmail,
          expiresAt: stageExpiresAt,
        },

        select: {
          id: true,
        },
      });

      const existingUser = await transaction.user.findUnique({
        where: {
          email: newEmail,
        },

        select: {
          id: true,
        },
      });

      if (existingUser) {
        await transaction.authChallenge.update({
          where: {
            id: stagedChallenge.id,
          },

          data: {
            revokedAt: now,
          },
        });

        return {
          status: "EMAIL_ALREADY_IN_USE",
        } as const;
      }

      await transaction.authChallenge.updateMany({
        where: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_VERIFICATION,
          consumedAt: null,
          revokedAt: null,
        },

        data: {
          revokedAt: now,
        },
      });

      return {
        status: "STAGED",
        challengeId: stagedChallenge.id,
        oldEmail: user.email,
        verificationToken,
      } as const;
    });

    if (stageResult.status === "UNAUTHORIZED") {
      return jsonResponse(
        {
          code: "UNAUTHORIZED",
        },
        401,
      );
    }

    if (stageResult.status === "EMAIL_ALREADY_VERIFIED") {
      return jsonResponse(
        {
          code: "EMAIL_ALREADY_VERIFIED",
        },
        409,
      );
    }

    if (stageResult.status === "EMAIL_UNCHANGED") {
      return jsonResponse(
        {
          code: "EMAIL_UNCHANGED",
        },
        409,
      );
    }

    if (stageResult.status === "EMAIL_ALREADY_IN_USE") {
      return jsonResponse(
        {
          code: "EMAIL_ALREADY_IN_USE",
        },
        409,
      );
    }

    if (stageResult.status === "RATE_LIMITED") {
      return jsonResponse(
        {
          code: "CHANGE_EMAIL_RATE_LIMITED",
          retryAfterSeconds: stageResult.retryAfterSeconds,
        },
        429,
        {
          "Retry-After": stageResult.retryAfterSeconds.toString(),
        },
      );
    }

    stagedChallengeId = stageResult.challengeId;

    try {
      const sentEmail = await sendEmailVerificationEmail({
        to: newEmail,
        verificationToken: stageResult.verificationToken,
        locale: emailLocale,
      });

      console.info("Verification email sent after email change:", sentEmail.id);
    } catch (error) {
      await revokeStagedChallenge(
        stageResult.challengeId,
        "undelivered",
      );

      console.error("Changed email verification delivery failed:", error);

      return jsonResponse(
        {
          code: "EMAIL_DELIVERY_FAILED",
        },
        503,
      );
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${session.user.id}::uuid
        FOR UPDATE
      `;

      const user = await transaction.user.findUnique({
        where: {
          id: session.user.id,
        },

        select: {
          email: true,
          emailVerifiedAt: true,
        },
      });

      const stagedChallenge = await transaction.authChallenge.findFirst({
        where: {
          id: stageResult.challengeId,
          userId: session.user.id,
          type: AuthChallengeType.EMAIL_CHANGE,
          target: newEmail,
          consumedAt: null,
          revokedAt: null,
        },

        select: {
          secretHash: true,
          expiresAt: true,
        },
      });

      const now = new Date();

      const liveSession = await transaction.session.findFirst({
        where: {
          id: session.id,
          userId: session.user.id,
          revokedAt: null,

          expiresAt: {
            gt: now,
          },
        },

        select: {
          id: true,
        },
      });

      if (!liveSession) {
        throw new EmailChangeUnauthorizedError();
      }

      if (!user) {
        throw new EmailChangeUnauthorizedError();
      }

      if (user.emailVerifiedAt) {
        throw new EmailAlreadyVerifiedError();
      }

      if (
        user.email !== stageResult.oldEmail ||
        !stagedChallenge ||
        stagedChallenge.expiresAt.getTime() <= now.getTime()
      ) {
        throw new EmailChangeConflictError();
      }

      const updatedUser = await transaction.user.updateMany({
        where: {
          id: session.user.id,
          email: stageResult.oldEmail,
          emailVerifiedAt: null,
        },

        data: {
          email: newEmail,
        },
      });

      if (updatedUser.count !== 1) {
        throw new EmailChangeConflictError();
      }

      await transaction.authChallenge.updateMany({
        where: {
          userId: session.user.id,
          type: AuthChallengeType.EMAIL_VERIFICATION,
          consumedAt: null,
          revokedAt: null,
        },

        data: {
          revokedAt: now,
        },
      });

      const consumedStage = await transaction.authChallenge.updateMany({
        where: {
          id: stageResult.challengeId,
          type: AuthChallengeType.EMAIL_CHANGE,
          consumedAt: null,
          revokedAt: null,
        },

        data: {
          consumedAt: now,
        },
      });

      if (consumedStage.count !== 1) {
        throw new EmailChangeConflictError();
      }

      await transaction.authChallenge.create({
        data: {
          userId: session.user.id,
          type: AuthChallengeType.EMAIL_VERIFICATION,
          secretHash: stagedChallenge.secretHash,
          target: newEmail,
          expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
        },
      });
    });

    return jsonResponse(
      {
        code: "EMAIL_CHANGED",

        ...(process.env.NODE_ENV === "development"
          ? {
              verificationToken: stageResult.verificationToken,
            }
          : {}),
      },
      201,
    );
  } catch (error) {
    if (stagedChallengeId) {
      await revokeStagedChallenge(stagedChallengeId, "failed");
    }

    if (error instanceof EmailChangeUnauthorizedError) {
      return jsonResponse(
        {
          code: "UNAUTHORIZED",
        },
        401,
      );
    }

    if (error instanceof EmailAlreadyVerifiedError) {
      return jsonResponse(
        {
          code: "EMAIL_ALREADY_VERIFIED",
        },
        409,
      );
    }

    if (error instanceof EmailChangeConflictError) {
      return jsonResponse(
        {
          code: "EMAIL_CHANGE_CONFLICT",
        },
        409,
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonResponse(
        {
          code: "EMAIL_ALREADY_IN_USE",
        },
        409,
      );
    }

    console.error("Changing unverified email failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}
