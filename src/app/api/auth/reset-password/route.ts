import type { NextRequest } from "next/server";

import { AuthChallengeType } from "@/generated/prisma/client";

import { resetPasswordRequestSchema } from "@/features/auth/reset-password/model/resetPasswordRequestSchema";
import {
  type AuthRateLimitRule,
  consumeAuthRateLimits,
} from "@/shared/lib/authRateLimit";
import { hashAuthToken } from "@/shared/lib/authToken";
import {
  createNoStoreJsonResponse as jsonResponse,
  isJsonRequest,
  isTrustedOrigin,
  readLimitedJsonBody,
} from "@/shared/lib/http";
import { hashPassword } from "@/shared/lib/password";
import { getPrisma } from "@/shared/lib/prisma";
import { resolveRequestIp } from "@/shared/lib/request";
import { clearSessionCookie } from "@/shared/lib/session";

import {
  MAX_RESET_PASSWORD_BODY_BYTES,
  RESET_PASSWORD_RATE_LIMITS,
} from "./constants";

export const runtime = "nodejs";

function createRateLimitRules(
  token: string,
  ipAddress: string | undefined,
) {
  return [
    ...(ipAddress
      ? [
          {
            ...RESET_PASSWORD_RATE_LIMITS.ip,
            value: ipAddress,
          },
        ]
      : []),
    {
      ...RESET_PASSWORD_RATE_LIMITS.token,
      value: token,
    },
  ] satisfies AuthRateLimitRule[];
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return jsonResponse(
    {
      code: "RESET_PASSWORD_RATE_LIMITED",
      retryAfterSeconds,
    },
    429,
    {
      "Retry-After": retryAfterSeconds.toString(),
    },
  );
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return jsonResponse({ code: "INVALID_ORIGIN" }, 403);
  }

  if (!isJsonRequest(request)) {
    return jsonResponse({ code: "UNSUPPORTED_MEDIA_TYPE" }, 415);
  }

  const bodyResult = await readLimitedJsonBody(
    request,
    MAX_RESET_PASSWORD_BODY_BYTES,
  );

  if (!bodyResult.ok) {
    return jsonResponse(
      { code: bodyResult.code },
      bodyResult.code === "PAYLOAD_TOO_LARGE" ? 413 : 400,
    );
  }

  const validationResult = resetPasswordRequestSchema.safeParse(
    bodyResult.body,
  );

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

  const { token, password } = validationResult.data;
  const ipResolution = resolveRequestIp(request);

  if (!ipResolution.ok && ipResolution.failClosed) {
    console.error(
      "Reset-password client IP resolution failed:",
      ipResolution.reason,
    );

    return jsonResponse({ code: "SERVICE_UNAVAILABLE" }, 503);
  }

  const rateLimitRules = createRateLimitRules(
    token,
    ipResolution.ok ? ipResolution.ipAddress : undefined,
  );

  try {
    const rateLimit = await consumeAuthRateLimits(rateLimitRules);

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.retryAfterSeconds);
    }

    const prisma = getPrisma();
    const tokenHash = hashAuthToken(token);
    const candidateChallenge = await prisma.authChallenge.findFirst({
      where: {
        type: AuthChallengeType.PASSWORD_RESET,
        secretHash: tokenHash,
      },
      select: { id: true, userId: true },
    });

    if (!candidateChallenge) {
      return jsonResponse({ code: "RESET_TOKEN_INVALID" }, 400);
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const result = await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${candidateChallenge.userId}::uuid
        FOR UPDATE
      `;

      const user = await transaction.user.findUnique({
        where: { id: candidateChallenge.userId },
        select: { id: true, email: true },
      });

      const challenge = await transaction.authChallenge.findFirst({
        where: {
          id: candidateChallenge.id,
          type: AuthChallengeType.PASSWORD_RESET,
          secretHash: tokenHash,
        },
        select: {
          id: true,
          userId: true,
          target: true,
          expiresAt: true,
          consumedAt: true,
          revokedAt: true,
        },
      });

      if (!user || !challenge || challenge.target !== user.email) {
        return { status: "INVALID" } as const;
      }

      if (challenge.revokedAt || challenge.consumedAt) {
        return { status: "INVALID" } as const;
      }

      if (challenge.expiresAt.getTime() <= now.getTime()) {
        return { status: "EXPIRED" } as const;
      }

      const consumedChallenge = await transaction.authChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });

      if (consumedChallenge.count !== 1) {
        return { status: "INVALID" } as const;
      }

      await transaction.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await transaction.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now },
      });

      await transaction.authChallenge.updateMany({
        where: {
          userId: user.id,
          id: { not: challenge.id },
          type: {
            in: [
              AuthChallengeType.PASSWORD_RESET,
              AuthChallengeType.EMAIL_CHANGE,
              AuthChallengeType.PHONE_CHANGE,
            ],
          },
          consumedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: now },
      });

      return { status: "RESET" } as const;
    });

    if (result.status === "EXPIRED") {
      return jsonResponse({ code: "RESET_TOKEN_EXPIRED" }, 400);
    }

    if (result.status !== "RESET") {
      return jsonResponse({ code: "RESET_TOKEN_INVALID" }, 400);
    }

    const response = jsonResponse({ code: "PASSWORD_RESET" }, 200);

    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error("Reset password failed:", error);

    return jsonResponse({ code: "INTERNAL_SERVER_ERROR" }, 500);
  }
}
