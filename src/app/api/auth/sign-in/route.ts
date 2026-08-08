import { type NextRequest, NextResponse } from "next/server";

import { Prisma, type UserRole } from "@/generated/prisma/client";

import { signInRequestSchema } from "@/features/auth/sign-in/model/signInRequestSchema";
import {
  type AuthRateLimitRule,
  clearAuthRateLimits,
  consumeAuthRateLimits,
} from "@/shared/lib/authRateLimit";
import { hashAuthToken } from "@/shared/lib/authToken";
import { verifyPasswordOrDummy } from "@/shared/lib/password";
import { getPrisma } from "@/shared/lib/prisma";
import { getRequestIp, getRequestUserAgent } from "@/shared/lib/request";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  setSessionCookie,
} from "@/shared/lib/session";

import {
  MAX_SIGN_IN_BODY_BYTES,
  SESSION_TOKEN_GENERATION_ATTEMPTS,
  SIGN_IN_RATE_LIMITS,
} from "./constants";

export const runtime = "nodejs";

type AuthenticatedUserSnapshot = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
};

class CredentialsChangedError extends Error {
  constructor() {
    super("Credentials changed while sign-in was in progress");
    this.name = "CredentialsChangedError";
  }
}

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

function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    const requestOrigin = new URL(origin).origin;
    const trustedOrigins = new Set([request.nextUrl.origin]);
    const configuredAppUrl = process.env.APP_URL?.trim();

    if (configuredAppUrl) {
      trustedOrigins.add(new URL(configuredAppUrl).origin);
    }

    return trustedOrigins.has(requestOrigin);
  } catch {
    return false;
  }
}

function isJsonRequest(request: NextRequest): boolean {
  return (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() === "application/json"
  );
}

function createIpRateLimitRules(ipAddress: string | undefined) {
  const rateLimitIdentity = ipAddress ?? "unknown";

  return [
    {
      ...SIGN_IN_RATE_LIMITS.ipBurst,
      value: rateLimitIdentity,
    },
    {
      ...SIGN_IN_RATE_LIMITS.ipHourly,
      value: rateLimitIdentity,
    },
  ] satisfies AuthRateLimitRule[];
}

function createAccountRateLimitRules(email: string) {
  return [
    {
      ...SIGN_IN_RATE_LIMITS.account,
      value: email,
    },
  ] satisfies AuthRateLimitRule[];
}

function createPairRateLimitRules(
  email: string,
  ipAddress: string | undefined,
) {
  if (!ipAddress) {
    return [];
  }

  return [
    {
      ...SIGN_IN_RATE_LIMITS.pair,
      value: `${email}\0${ipAddress}`,
    },
  ] satisfies AuthRateLimitRule[];
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return jsonResponse(
    {
      code: "SIGN_IN_RATE_LIMITED",
      retryAfterSeconds,
    },
    429,
    {
      "Retry-After": retryAfterSeconds.toString(),
    },
  );
}

async function createFreshSession({
  user,
  previousSessionTokenHash,
  ipAddress,
  userAgent,
}: {
  user: AuthenticatedUserSnapshot;
  previousSessionTokenHash: string | undefined;
  ipAddress: string | undefined;
  userAgent: string | undefined;
}) {
  const prisma = getPrisma();

  for (
    let attempt = 0;
    attempt < SESSION_TOKEN_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    const {
      token: sessionToken,
      tokenHash: sessionTokenHash,
      expiresAt: sessionExpiresAt,
    } = createSessionToken();

    try {
      const currentUser = await prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "users"
          WHERE "id" = ${user.id}::uuid
          FOR UPDATE
        `;

        const lockedUser = await transaction.user.findUnique({
          where: {
            id: user.id,
          },

          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            passwordHash: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
          },
        });

        if (
          !lockedUser ||
          lockedUser.email !== user.email ||
          lockedUser.passwordHash !== user.passwordHash
        ) {
          throw new CredentialsChangedError();
        }

        if (previousSessionTokenHash) {
          await transaction.session.updateMany({
            where: {
              tokenHash: previousSessionTokenHash,
              revokedAt: null,
            },

            data: {
              revokedAt: new Date(),
            },
          });
        }

        await transaction.session.create({
          data: {
            userId: lockedUser.id,
            tokenHash: sessionTokenHash,
            expiresAt: sessionExpiresAt,
            ipAddress,
            userAgent,
          },
        });

        return lockedUser;
      });

      return {
        sessionToken,
        sessionExpiresAt,
        user: currentUser,
      };
    } catch (error) {
      const isTokenCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isTokenCollision || attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error("Could not create a unique session token");
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

  const declaredBodyLength = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(declaredBodyLength) &&
    declaredBodyLength > MAX_SIGN_IN_BODY_BYTES
  ) {
    return jsonResponse(
      {
        code: "PAYLOAD_TOO_LARGE",
      },
      413,
    );
  }

  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_SIGN_IN_BODY_BYTES) {
    return jsonResponse(
      {
        code: "PAYLOAD_TOO_LARGE",
      },
      413,
    );
  }

  let body: unknown;

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

  const validationResult = signInRequestSchema.safeParse(body);

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

  const { email, password } = validationResult.data;
  const ipAddress = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);

  const ipRateLimitRules = createIpRateLimitRules(ipAddress);
  const accountRateLimitRules = createAccountRateLimitRules(email);
  const pairRateLimitRules = createPairRateLimitRules(
    email,
    ipAddress,
  );

  try {
    const ipRateLimit = await consumeAuthRateLimits(ipRateLimitRules);

    if (!ipRateLimit.allowed) {
      return rateLimitedResponse(ipRateLimit.retryAfterSeconds);
    }

    const pairRateLimit = await consumeAuthRateLimits(pairRateLimitRules);

    if (!pairRateLimit.allowed) {
      return rateLimitedResponse(pairRateLimit.retryAfterSeconds);
    }

    const accountRateLimit = await consumeAuthRateLimits(
      accountRateLimitRules,
    );

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        passwordHash: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
      },
    });

    const passwordMatches = await verifyPasswordOrDummy(
      password,
      user?.passwordHash,
    );

    if (!user || !passwordMatches) {
      if (!accountRateLimit.allowed) {
        return rateLimitedResponse(accountRateLimit.retryAfterSeconds);
      }

      return jsonResponse(
        {
          code: "INVALID_CREDENTIALS",
        },
        401,
      );
    }

    const previousSessionToken = request.cookies.get(
      SESSION_COOKIE_NAME,
    )?.value;

    const previousSessionTokenHash = previousSessionToken
      ? hashAuthToken(previousSessionToken)
      : undefined;

    const session = await createFreshSession({
      user,
      previousSessionTokenHash,
      ipAddress,
      userAgent,
    });

    try {
      await clearAuthRateLimits([
        ...accountRateLimitRules,
        ...pairRateLimitRules,
      ]);
    } catch (error) {
      console.error("Clearing successful sign-in rate limits failed:", error);
    }

    const response = jsonResponse(
      {
        code: "SIGNED_IN",
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone,
          role: session.user.role,
          emailVerifiedAt: session.user.emailVerifiedAt,
          phoneVerifiedAt: session.user.phoneVerifiedAt,
        },
        next: session.user.emailVerifiedAt ? "HOME" : "VERIFY_EMAIL",
      },
      200,
    );

    setSessionCookie(
      response,
      session.sessionToken,
      session.sessionExpiresAt,
    );

    return response;
  } catch (error) {
    if (error instanceof CredentialsChangedError) {
      return jsonResponse(
        {
          code: "INVALID_CREDENTIALS",
        },
        401,
      );
    }

    console.error("Sign-in failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}
