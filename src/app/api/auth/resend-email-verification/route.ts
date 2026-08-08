import { type NextRequest, NextResponse } from "next/server";

import { AuthChallengeType } from "@/generated/prisma/client";

import { resendEmailVerificationRequestSchema } from "@/features/auth/verify-email/model/resendEmailVerificationRequestSchema";
import { isAppLocale, routing } from "@/i18n/routing";
import { EMAIL_VERIFICATION_TTL_MS } from "@/shared/config/auth";
import { createAuthToken, hashAuthToken } from "@/shared/lib/authToken";
import { sendEmailVerificationEmail } from "@/shared/lib/email";
import { getPrisma } from "@/shared/lib/prisma";
import { getCurrentSession } from "@/shared/lib/session";

import { EMAIL_VERIFICATION_RESEND_POLICY } from "./constants";

export const runtime = "nodejs";

type ResendUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
};

type ResendContext = {
  user: ResendUser;
  sessionId?: string;
  sourceTokenHash?: string;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers?: HeadersInit,
) {
  const response = NextResponse.json(body, {
    status,
    headers,
  });

  response.headers.set("Cache-Control", "no-store");

  return response;
}

function getRetryAfterSeconds(
  challengeCreatedAt: Date | undefined,
  now: Date,
): number {
  if (!challengeCreatedAt) {
    return 0;
  }

  const nextAllowedAt =
    challengeCreatedAt.getTime() +
    EMAIL_VERIFICATION_RESEND_POLICY.cooldownMs;

  return Math.max(0, Math.ceil((nextAllowedAt - now.getTime()) / 1000));
}

async function findResendContext(
  request: NextRequest,
  token?: string,
): Promise<ResendContext | null> {
  if (!token) {
    const session = await getCurrentSession(request);

    if (!session) {
      return null;
    }

    return {
      sessionId: session.id,

      user: {
        id: session.user.id,
        email: session.user.email,
        emailVerifiedAt: session.user.emailVerifiedAt,
      },
    };
  }

  const prisma = getPrisma();
  const sourceTokenHash = hashAuthToken(token);

  const sourceChallenge = await prisma.authChallenge.findFirst({
    where: {
      type: AuthChallengeType.EMAIL_VERIFICATION,
      secretHash: sourceTokenHash,
      consumedAt: null,
      revokedAt: null,
    },

    select: {
      target: true,
      expiresAt: true,

      user: {
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (
    !sourceChallenge ||
    sourceChallenge.target !== sourceChallenge.user.email ||
    sourceChallenge.expiresAt.getTime() +
      EMAIL_VERIFICATION_RESEND_POLICY.contextGraceMs <=
      Date.now()
  ) {
    return null;
  }

  return {
    user: sourceChallenge.user,
    sourceTokenHash,
  };
}

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();

    const token =
      request.nextUrl.searchParams.get("token")?.trim() || undefined;

    const context = await findResendContext(request, token);

    if (!context) {
      return jsonResponse(
        {
          code: "VERIFICATION_CONTEXT_INVALID",
        },
        400,
      );
    }

    const { user } = context;

    if (user.emailVerifiedAt) {
      return jsonResponse(
        {
          code: "EMAIL_ALREADY_VERIFIED",
          retryAfterSeconds: 0,
        },
        200,
      );
    }

    const now = new Date();

    const pendingEmailChange = await prisma.authChallenge.findFirst({
      where: {
        userId: user.id,
        type: AuthChallengeType.EMAIL_CHANGE,
        consumedAt: null,
        revokedAt: null,

        expiresAt: {
          gt: now,
        },
      },

      select: {
        expiresAt: true,
      },
    });

    if (pendingEmailChange) {
      return jsonResponse(
        {
          code: "RESEND_STATUS",
          retryAfterSeconds: Math.max(
            1,
            Math.ceil(
              (pendingEmailChange.expiresAt.getTime() - now.getTime()) / 1000,
            ),
          ),
        },
        200,
      );
    }

    const latestChallenge = await prisma.authChallenge.findFirst({
      where: {
        userId: user.id,
        type: AuthChallengeType.EMAIL_VERIFICATION,
        target: user.email,
      },

      select: {
        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const retryAfterSeconds = getRetryAfterSeconds(
      latestChallenge?.createdAt,
      now,
    );

    return jsonResponse(
      {
        code: "RESEND_STATUS",
        retryAfterSeconds,
      },
      200,
    );
  } catch (error) {
    console.error("Getting resend email verification status failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  let body: unknown = {};

  const rawBody = await request.text();

  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse(
        {
          code: "INVALID_JSON",
        },
        400,
      );
    }
  }

  const validationResult = resendEmailVerificationRequestSchema.safeParse(body);

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

  const requestedLocale =
    typeof validationResult.data.locale === "string"
      ? validationResult.data.locale
      : "";

  const emailLocale = isAppLocale(requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  try {
    const prisma = getPrisma();
    const context = await findResendContext(
      request,
      validationResult.data.token,
    );

    if (!context) {
      return jsonResponse(
        {
          code: "VERIFICATION_CONTEXT_INVALID",
        },
        400,
      );
    }

    const issueResult = await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${context.user.id}::uuid
        FOR UPDATE
      `;

      const user = await transaction.user.findUnique({
        where: {
          id: context.user.id,
        },

        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
        },
      });

      if (!user) {
        return {
          status: "CONTEXT_INVALID",
        } as const;
      }

      const now = new Date();

      if (context.sessionId) {
        const liveSession = await transaction.session.findFirst({
          where: {
            id: context.sessionId,
            userId: user.id,
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
          return {
            status: "CONTEXT_INVALID",
          } as const;
        }
      }

      if (context.sourceTokenHash) {
        const sourceChallenge = await transaction.authChallenge.findFirst({
          where: {
            userId: user.id,
            type: AuthChallengeType.EMAIL_VERIFICATION,
            secretHash: context.sourceTokenHash,
            consumedAt: null,
            revokedAt: null,
          },

          select: {
            target: true,
            expiresAt: true,
          },
        });

        if (
          !sourceChallenge ||
          sourceChallenge.target !== user.email ||
          sourceChallenge.expiresAt.getTime() +
            EMAIL_VERIFICATION_RESEND_POLICY.contextGraceMs <=
            now.getTime()
        ) {
          return {
            status: "CONTEXT_INVALID",
          } as const;
        }
      }

      if (user.emailVerifiedAt) {
        return {
          status: "ALREADY_VERIFIED",
        } as const;
      }

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

      const pendingEmailChange = await transaction.authChallenge.findFirst({
        where: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_CHANGE,
          consumedAt: null,
          revokedAt: null,

          expiresAt: {
            gt: now,
          },
        },

        select: {
          expiresAt: true,
        },
      });

      if (pendingEmailChange) {
        return {
          status: "RATE_LIMITED",
          retryAfterSeconds: Math.max(
            1,
            Math.ceil(
              (pendingEmailChange.expiresAt.getTime() - now.getTime()) / 1000,
            ),
          ),
        } as const;
      }

      const resendWindowStart = new Date(
        now.getTime() - EMAIL_VERIFICATION_RESEND_POLICY.windowMs,
      );

      const recentChallenges = await transaction.authChallenge.findMany({
        where: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_VERIFICATION,
          target: user.email,

          createdAt: {
            gte: resendWindowStart,
          },
        },

        select: {
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: EMAIL_VERIFICATION_RESEND_POLICY.limitPerWindow,
      });

      const latestChallenge = recentChallenges[0];
      const retryAfterSeconds = getRetryAfterSeconds(
        latestChallenge?.createdAt,
        now,
      );

      if (retryAfterSeconds > 0) {
        return {
          status: "RATE_LIMITED",
          retryAfterSeconds,
        } as const;
      }

      if (
        recentChallenges.length >=
        EMAIL_VERIFICATION_RESEND_POLICY.limitPerWindow
      ) {
        const oldestChallenge = recentChallenges[recentChallenges.length - 1];
        const nextAllowedAt =
          oldestChallenge.createdAt.getTime() +
          EMAIL_VERIFICATION_RESEND_POLICY.windowMs;

        const limitRetryAfterSeconds = Math.max(
          1,
          Math.ceil((nextAllowedAt - now.getTime()) / 1000),
        );

        return {
          status: "RATE_LIMITED",
          retryAfterSeconds: limitRetryAfterSeconds,
        } as const;
      }

      const { token: verificationToken, tokenHash } = createAuthToken();

      const newChallenge = await transaction.authChallenge.create({
        data: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_VERIFICATION,
          secretHash: tokenHash,
          target: user.email,
          expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
        },

        select: {
          id: true,
          createdAt: true,
        },
      });

      return {
        status: "ISSUED",
        challengeId: newChallenge.id,
        challengeCreatedAt: newChallenge.createdAt,
        email: user.email,
        verificationToken,
      } as const;
    });

    if (issueResult.status === "CONTEXT_INVALID") {
      return jsonResponse(
        {
          code: "VERIFICATION_CONTEXT_INVALID",
        },
        400,
      );
    }

    if (issueResult.status === "ALREADY_VERIFIED") {
      return jsonResponse(
        {
          code: "EMAIL_ALREADY_VERIFIED",
          retryAfterSeconds: 0,
        },
        200,
      );
    }

    if (issueResult.status === "RATE_LIMITED") {
      return jsonResponse(
        {
          code: "RESEND_TOO_SOON",
          retryAfterSeconds: issueResult.retryAfterSeconds,
        },
        429,
        {
          "Retry-After": issueResult.retryAfterSeconds.toString(),
        },
      );
    }

    try {
      const sentEmail = await sendEmailVerificationEmail({
        to: issueResult.email,
        verificationToken: issueResult.verificationToken,
        locale: emailLocale,
      });

      console.info("Verification email resent:", sentEmail.id);
    } catch (error) {
      try {
        await prisma.authChallenge.updateMany({
          where: {
            id: issueResult.challengeId,
            consumedAt: null,
            revokedAt: null,
          },

          data: {
            revokedAt: new Date(),
          },
        });
      } catch (cleanupError) {
        console.error(
          "Failed to revoke undelivered verification challenge:",
          cleanupError,
        );
      }

      console.error("Verification email delivery failed:", error);

      return jsonResponse(
        {
          code: "EMAIL_DELIVERY_FAILED",
        },
        503,
      );
    }

    const finalizeResult = await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${context.user.id}::uuid
        FOR UPDATE
      `;

      const user = await transaction.user.findUnique({
        where: {
          id: context.user.id,
        },

        select: {
          email: true,
          emailVerifiedAt: true,
        },
      });

      if (user?.emailVerifiedAt) {
        return {
          status: "ALREADY_VERIFIED",
        } as const;
      }

      const newChallenge = await transaction.authChallenge.findFirst({
        where: {
          id: issueResult.challengeId,
          userId: context.user.id,
          type: AuthChallengeType.EMAIL_VERIFICATION,
          target: issueResult.email,
          consumedAt: null,
          revokedAt: null,
        },

        select: {
          id: true,
        },
      });

      if (!user || user.email !== issueResult.email || !newChallenge) {
        return {
          status: "CONTEXT_INVALID",
        } as const;
      }

      await transaction.authChallenge.updateMany({
        where: {
          userId: context.user.id,
          type: AuthChallengeType.EMAIL_VERIFICATION,
          target: issueResult.email,

          id: {
            not: issueResult.challengeId,
          },

          consumedAt: null,
          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),
        },
      });

      return {
        status: "FINALIZED",
      } as const;
    });

    if (finalizeResult.status === "ALREADY_VERIFIED") {
      return jsonResponse(
        {
          code: "EMAIL_ALREADY_VERIFIED",
          retryAfterSeconds: 0,
        },
        200,
      );
    }

    if (finalizeResult.status === "CONTEXT_INVALID") {
      return jsonResponse(
        {
          code: "VERIFICATION_CONTEXT_INVALID",
        },
        409,
      );
    }

    const newRetryAfterSeconds = getRetryAfterSeconds(
      issueResult.challengeCreatedAt,
      new Date(),
    );

    return jsonResponse(
      {
        code: "VERIFICATION_TOKEN_REISSUED",
        retryAfterSeconds: newRetryAfterSeconds,

        ...(process.env.NODE_ENV === "development"
          ? {
              verificationToken: issueResult.verificationToken,
            }
          : {}),
      },
      201,
    );
  } catch (error) {
    console.error("Resend email verification failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}
