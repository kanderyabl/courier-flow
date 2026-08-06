import { type NextRequest, NextResponse } from "next/server";

import { AuthChallengeType } from "@/generated/prisma/client";

import { resendEmailVerificationRequestSchema } from "@/features/auth/verify-email/model/resendEmailVerificationRequestSchema";
import { createAuthToken, hashAuthToken } from "@/shared/lib/authToken";
import { sendEmailVerificationEmail } from "@/shared/lib/email";
import { getPrisma } from "@/shared/lib/prisma";
import { getCurrentSession } from "@/shared/lib/session";

export const runtime = "nodejs";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const RESEND_COOLDOWN_MS = 60 * 1000;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const RESEND_LIMIT_PER_HOUR = 5;

type ResendUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
};

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

  try {
    const prisma = getPrisma();
    const session = await getCurrentSession(request);

    let user: ResendUser | null = null;

    if (session) {
      user = {
        id: session.user.id,
        email: session.user.email,
        emailVerifiedAt: session.user.emailVerifiedAt,
      };
    }

    if (!user && validationResult.data.token) {
      const sourceTokenHash = hashAuthToken(validationResult.data.token);

      const sourceChallenge = await prisma.authChallenge.findFirst({
        where: {
          type: AuthChallengeType.EMAIL_VERIFICATION,
          secretHash: sourceTokenHash,
        },

        select: {
          target: true,

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
        sourceChallenge &&
        sourceChallenge.target === sourceChallenge.user.email
      ) {
        user = sourceChallenge.user;
      }
    }

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
    if (latestChallenge) {
      const nextAllowedAt =
        latestChallenge.createdAt.getTime() + RESEND_COOLDOWN_MS;

      if (nextAllowedAt > now.getTime()) {
        const retryAfterSeconds = Math.ceil(
          (nextAllowedAt - now.getTime()) / 1000,
        );

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
    }
    if (recentChallenges.length >= RESEND_LIMIT_PER_HOUR) {
      const oldestChallenge = recentChallenges[recentChallenges.length - 1];

      const nextAllowedAt =
        oldestChallenge.createdAt.getTime() + RESEND_WINDOW_MS;

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((nextAllowedAt - now.getTime()) / 1000),
      );

      return NextResponse.json(
        {
          code: "RESEND_LIMIT_REACHED",
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
      },
    });

    try {
      const sentEmail = await sendEmailVerificationEmail({
        to: user.email,
        verificationToken,
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

    return NextResponse.json(
      {
        code: "VERIFICATION_TOKEN_REISSUED",

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
