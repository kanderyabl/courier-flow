import { type NextRequest, NextResponse } from "next/server";

import { AuthChallengeType } from "@/generated/prisma/client";

import { resendEmailVerificationRequestSchema } from "@/features/auth/verify-email/model/resendEmailVerificationRequestSchema";
import { isAppLocale, routing } from "@/i18n/routing";
import { createAuthToken, hashAuthToken } from "@/shared/lib/authToken";
import { sendEmailVerificationEmail } from "@/shared/lib/email";
import { getPrisma } from "@/shared/lib/prisma";
import { getCurrentSession } from "@/shared/lib/session";

export const runtime = "nodejs";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_CONTEXT_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

const RESEND_COOLDOWN_MS = 60 * 1000;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const RESEND_LIMIT_PER_HOUR = 5;

type ResendUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
};

function getRetryAfterSeconds(
  challengeCreatedAt: Date | undefined,
  now: Date,
): number {
  if (!challengeCreatedAt) {
    return 0;
  }

  const nextAllowedAt = challengeCreatedAt.getTime() + RESEND_COOLDOWN_MS;

  return Math.max(0, Math.ceil((nextAllowedAt - now.getTime()) / 1000));
}

async function findResendUser(
  request: NextRequest,
  token?: string,
): Promise<ResendUser | null> {
  if (!token) {
    const session = await getCurrentSession(request);

    if (!session) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      emailVerifiedAt: session.user.emailVerifiedAt,
    };
  }

  const prisma = getPrisma();
  const sourceTokenHash = hashAuthToken(token);

  const sourceChallenge = await prisma.authChallenge.findFirst({
    where: {
      type: AuthChallengeType.EMAIL_VERIFICATION,
      secretHash: sourceTokenHash,
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
    sourceChallenge.expiresAt.getTime() + RESEND_CONTEXT_GRACE_MS <= Date.now()
  ) {
    return null;
  }

  return sourceChallenge.user;
}

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();

    const token =
      request.nextUrl.searchParams.get("token")?.trim() || undefined;

    const user = await findResendUser(request, token);

    if (!user) {
      return NextResponse.json(
        {
          code: "VERIFICATION_CONTEXT_INVALID",
        },
        {
          status: 400,

          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        {
          code: "EMAIL_ALREADY_VERIFIED",
          retryAfterSeconds: 0,
        },
        {
          status: 200,

          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const latestChallenge = await prisma.authChallenge.findFirst({
      where: {
        userId: user.id,
        type: AuthChallengeType.EMAIL_VERIFICATION,
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
      new Date(),
    );

    return NextResponse.json(
      {
        code: "RESEND_STATUS",
        retryAfterSeconds,
      },
      {
        status: 200,

        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Getting resend email verification status failed:", error);

    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,

        headers: {
          "Cache-Control": "no-store",
        },
      },
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
      return NextResponse.json(
        {
          code: "INVALID_JSON",
        },
        {
          status: 400,
        },
      );
    }
  }

  const validationResult = resendEmailVerificationRequestSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",

        issues: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          code: issue.message,
        })),
      },
      {
        status: 400,
      },
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

    const user = await findResendUser(request, validationResult.data.token);

    if (!user) {
      return NextResponse.json(
        {
          code: "VERIFICATION_CONTEXT_INVALID",
        },
        {
          status: 400,
        },
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        {
          code: "EMAIL_ALREADY_VERIFIED",
          retryAfterSeconds: 0,
        },
        {
          status: 200,
        },
      );
    }

    const now = new Date();

    const resendWindowStart = new Date(now.getTime() - RESEND_WINDOW_MS);

    const recentChallenges = await prisma.authChallenge.findMany({
      where: {
        userId: user.id,
        type: AuthChallengeType.EMAIL_VERIFICATION,

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

      take: RESEND_LIMIT_PER_HOUR,
    });

    const latestChallenge = recentChallenges[0];

    const retryAfterSeconds = getRetryAfterSeconds(
      latestChallenge?.createdAt,
      now,
    );

    if (retryAfterSeconds > 0) {
      return NextResponse.json(
        {
          code: "RESEND_TOO_SOON",
          retryAfterSeconds,
        },
        {
          status: 429,

          headers: {
            "Retry-After": retryAfterSeconds.toString(),
          },
        },
      );
    }

    if (recentChallenges.length >= RESEND_LIMIT_PER_HOUR) {
      const oldestChallenge = recentChallenges[recentChallenges.length - 1];

      const nextAllowedAt =
        oldestChallenge.createdAt.getTime() + RESEND_WINDOW_MS;

      const limitRetryAfterSeconds = Math.max(
        1,
        Math.ceil((nextAllowedAt - now.getTime()) / 1000),
      );

      return NextResponse.json(
        {
          code: "RESEND_LIMIT_REACHED",
          retryAfterSeconds: limitRetryAfterSeconds,
        },
        {
          status: 429,

          headers: {
            "Retry-After": limitRetryAfterSeconds.toString(),
          },
        },
      );
    }

    const { token: verificationToken, tokenHash: verificationTokenHash } =
      createAuthToken();

    const verificationExpiresAt = new Date(
      now.getTime() + EMAIL_VERIFICATION_TTL_MS,
    );

    const newChallenge = await prisma.authChallenge.create({
      data: {
        userId: user.id,
        type: AuthChallengeType.EMAIL_VERIFICATION,
        secretHash: verificationTokenHash,
        target: user.email,
        expiresAt: verificationExpiresAt,
      },

      select: {
        id: true,
        createdAt: true,
      },
    });

    try {
      const sentEmail = await sendEmailVerificationEmail({
        to: user.email,
        verificationToken,
        locale: emailLocale,
      });

      console.info("Verification email resent:", sentEmail.id);
    } catch (error) {
      try {
        await prisma.authChallenge.deleteMany({
          where: {
            id: newChallenge.id,
            consumedAt: null,
          },
        });
      } catch (cleanupError) {
        console.error(
          "Failed to remove undelivered verification challenge:",
          cleanupError,
        );
      }

      console.error("Verification email delivery failed:", error);

      return NextResponse.json(
        {
          code: "EMAIL_DELIVERY_FAILED",
        },
        {
          status: 503,
        },
      );
    }

    try {
      await prisma.authChallenge.updateMany({
        where: {
          userId: user.id,
          type: AuthChallengeType.EMAIL_VERIFICATION,

          id: {
            not: newChallenge.id,
          },

          consumedAt: null,
          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(
        "Failed to revoke previous verification challenges:",
        error,
      );
    }

    const newRetryAfterSeconds = getRetryAfterSeconds(
      newChallenge.createdAt,
      new Date(),
    );

    return NextResponse.json(
      {
        code: "VERIFICATION_TOKEN_REISSUED",
        retryAfterSeconds: newRetryAfterSeconds,

        ...(process.env.NODE_ENV === "development"
          ? {
              verificationToken,
            }
          : {}),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Resend email verification failed:", error);

    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
      },
    );
  }
}
