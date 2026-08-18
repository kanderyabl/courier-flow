import { AuthChallengeType, Prisma, UserRole } from "@/generated/prisma/client";

import { signUpRequestSchema } from "@/features/auth/sign-up/model/signUpRequestSchema";
import { isAppLocale, routing } from "@/i18n/routing";
import { EMAIL_VERIFICATION_TTL_MS } from "@/shared/config/auth";
import {
  type AuthRateLimitRule,
  consumeAuthRateLimits,
} from "@/shared/lib/authRateLimit";
import { createAuthToken } from "@/shared/lib/authToken";
import { sendEmailVerificationEmail } from "@/shared/lib/email";
import {
  createNoStoreJsonResponse as jsonResponse,
  isJsonRequest,
  isTrustedOrigin,
  readLimitedJsonBody,
} from "@/shared/lib/http";
import { hashPassword } from "@/shared/lib/password";
import { getPrisma } from "@/shared/lib/prisma";
import {
  getRequestUserAgent,
  resolveRequestIp,
} from "@/shared/lib/request";
import { createSessionToken, setSessionCookie } from "@/shared/lib/session";

import { MAX_SIGN_UP_BODY_BYTES, SIGN_UP_RATE_LIMITS } from "./constants";

export const runtime = "nodejs";

function createIpRateLimitRules(ipAddress: string | undefined) {
  if (!ipAddress) {
    return [];
  }

  return [
    {
      ...SIGN_UP_RATE_LIMITS.ipBurst,
      value: ipAddress,
    },
    {
      ...SIGN_UP_RATE_LIMITS.ipHourly,
      value: ipAddress,
    },
  ] satisfies AuthRateLimitRule[];
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return jsonResponse(
    {
      code: "SIGN_UP_RATE_LIMITED",
      retryAfterSeconds,
    },
    429,
    {
      "Retry-After": retryAfterSeconds.toString(),
    },
  );
}

export async function POST(request: Request) {
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
    bodyResult = await readLimitedJsonBody(request, MAX_SIGN_UP_BODY_BYTES);
  } catch (error) {
    console.error("Reading sign-up request body failed:", error);

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

  const validationResult = signUpRequestSchema.safeParse(bodyResult.body);

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

  const { name, email, phone, password, locale: requestedLocale } =
    validationResult.data;

  const emailLocale =
    typeof requestedLocale === "string" && isAppLocale(requestedLocale)
      ? requestedLocale
      : routing.defaultLocale;
  const ipResolution = resolveRequestIp(request);

  if (!ipResolution.ok && ipResolution.failClosed) {
    console.error(
      "Resolving sign-up client IP failed:",
      ipResolution.reason,
    );

    return jsonResponse(
      {
        code: "SERVICE_UNAVAILABLE",
      },
      503,
    );
  }

  const ipAddress = ipResolution.ok
    ? ipResolution.ipAddress
    : undefined;
  const userAgent = getRequestUserAgent(request);
  const rateLimitRules = createIpRateLimitRules(ipAddress);

  try {
    const rateLimit = await consumeAuthRateLimits(rateLimitRules);

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.retryAfterSeconds);
    }

    const prisma = getPrisma();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            phone,
          },
        ],
      },

      select: {
        email: true,
        phone: true,
      },
    });

    if (existingUser?.email === email) {
      return jsonResponse(
        {
          code: "EMAIL_ALREADY_IN_USE",
        },
        409,
      );
    }

    if (existingUser?.phone === phone) {
      return jsonResponse(
        {
          code: "PHONE_ALREADY_IN_USE",
        },
        409,
      );
    }

    const passwordHash = await hashPassword(password);

    const { token: verificationToken, tokenHash: verificationTokenHash } =
      createAuthToken();

    const verificationExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TTL_MS,
    );

    const {
      token: sessionToken,
      tokenHash: sessionTokenHash,
      expiresAt: sessionExpiresAt,
    } = createSessionToken();

    const user = await prisma.user.create({
      data: {
        role: UserRole.CLIENT,
        name,
        email,
        phone,
        passwordHash,

        authChallenges: {
          create: {
            type: AuthChallengeType.EMAIL_VERIFICATION,
            secretHash: verificationTokenHash,
            target: email,
            expiresAt: verificationExpiresAt,
          },
        },

        sessions: {
          create: {
            tokenHash: sessionTokenHash,
            expiresAt: sessionExpiresAt,
            ipAddress,
            userAgent,
          },
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    let emailDelivery: "sent" | "failed" = "sent";

    try {
      const sentEmail = await sendEmailVerificationEmail({
        to: user.email,
        verificationToken,
        locale: emailLocale,
      });

      console.info("Verification email sent:", sentEmail.id);
    } catch (error) {
      emailDelivery = "failed";

      console.error("Verification email delivery failed:", error);
    }

    const response = jsonResponse(
      {
        user,
        emailDelivery,
        ...(process.env.NODE_ENV === "development"
          ? {
              verificationToken,
            }
          : {}),
      },
      201,
    );

    setSessionCookie(response, sessionToken, sessionExpiresAt);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonResponse(
        {
          code: "ACCOUNT_ALREADY_EXISTS",
        },
        409,
      );
    }

    console.error("Sign-up failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}
