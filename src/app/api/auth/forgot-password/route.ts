import type { NextRequest } from "next/server";

import { AuthChallengeType } from "@/generated/prisma/client";

import { forgotPasswordRequestSchema } from "@/features/auth/forgot-password/model/forgotPasswordRequestSchema";
import { isAppLocale, routing } from "@/i18n/routing";
import {
  type AuthRateLimitRule,
  consumeAuthRateLimits,
} from "@/shared/lib/authRateLimit";
import { createAuthToken } from "@/shared/lib/authToken";
import { sendPasswordResetEmail } from "@/shared/lib/email";
import {
  createNoStoreJsonResponse as jsonResponse,
  isJsonRequest,
  isTrustedOrigin,
  readLimitedJsonBody,
} from "@/shared/lib/http";
import { getPrisma } from "@/shared/lib/prisma";
import { resolveRequestIp } from "@/shared/lib/request";

import {
  FORGOT_PASSWORD_RATE_LIMITS,
  MAX_FORGOT_PASSWORD_BODY_BYTES,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from "./constants";

export const runtime = "nodejs";

function createRateLimitRules(
  email: string,
  ipAddress: string | undefined,
) {
  return [
    ...(ipAddress
      ? [
          {
            ...FORGOT_PASSWORD_RATE_LIMITS.ip,
            value: ipAddress,
          },
        ]
      : []),
    {
      ...FORGOT_PASSWORD_RATE_LIMITS.accountCooldown,
      value: email,
    },
    {
      ...FORGOT_PASSWORD_RATE_LIMITS.accountHourly,
      value: email,
    },
  ] satisfies AuthRateLimitRule[];
}

function acceptedResponse() {
  return jsonResponse(
    {
      code: "PASSWORD_RESET_REQUEST_ACCEPTED",
    },
    202,
  );
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return jsonResponse(
    {
      code: "FORGOT_PASSWORD_RATE_LIMITED",
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
    MAX_FORGOT_PASSWORD_BODY_BYTES,
  );

  if (!bodyResult.ok) {
    return jsonResponse(
      { code: bodyResult.code },
      bodyResult.code === "PAYLOAD_TOO_LARGE" ? 413 : 400,
    );
  }

  const validationResult = forgotPasswordRequestSchema.safeParse(
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

  const { email, locale: requestedLocale } = validationResult.data;
  const emailLocale =
    typeof requestedLocale === "string" && isAppLocale(requestedLocale)
      ? requestedLocale
      : routing.defaultLocale;
  const ipResolution = resolveRequestIp(request);

  if (!ipResolution.ok && ipResolution.failClosed) {
    console.error(
      "Forgot-password client IP resolution failed:",
      ipResolution.reason,
    );

    return jsonResponse({ code: "SERVICE_UNAVAILABLE" }, 503);
  }

  const rateLimitRules = createRateLimitRules(
    email,
    ipResolution.ok ? ipResolution.ipAddress : undefined,
  );

  try {
    const rateLimit = await consumeAuthRateLimits(rateLimitRules);

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.retryAfterSeconds);
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return acceptedResponse();
    }

    const { token: resetToken, tokenHash } = createAuthToken();
    const now = new Date();

    const challenge = await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${user.id}::uuid
        FOR UPDATE
      `;

      const liveUser = await transaction.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true },
      });

      if (!liveUser || liveUser.email !== email) {
        return null;
      }

      return transaction.authChallenge.create({
        data: {
          userId: liveUser.id,
          type: AuthChallengeType.PASSWORD_RESET,
          secretHash: tokenHash,
          target: liveUser.email,
          expiresAt: new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS),
        },
        select: { id: true, userId: true, target: true },
      });
    });

    if (!challenge?.target) {
      return acceptedResponse();
    }

    let emailDelivered = false;

    try {
      const sentEmail = await sendPasswordResetEmail({
        to: challenge.target,
        resetToken,
        locale: emailLocale,
      });

      console.info("Password reset email sent:", sentEmail.id);
      emailDelivered = true;
    } catch (error) {
      console.error("Password reset email delivery failed:", error);
    }

    if (!emailDelivered) {
      try {
        await prisma.authChallenge.updateMany({
          where: {
            id: challenge.id,
            consumedAt: null,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      } catch (error) {
        console.error("Revoking undelivered password reset failed:", error);
      }

      return acceptedResponse();
    }

    try {
      await prisma.authChallenge.updateMany({
        where: {
          userId: challenge.userId,
          type: AuthChallengeType.PASSWORD_RESET,
          id: { not: challenge.id },
          consumedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } catch (error) {
      console.error("Revoking previous password reset links failed:", error);
    }

    return acceptedResponse();
  } catch (error) {
    console.error("Forgot password request failed:", error);

    return jsonResponse({ code: "INTERNAL_SERVER_ERROR" }, 500);
  }
}
