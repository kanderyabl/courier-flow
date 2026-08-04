import { AuthChallengeType } from "@/generated/prisma/client";

import { verifyEmailRequestSchema } from "@/features/auth/verify-email/model/verifyEmailRequestSchema";
import { hashAuthToken } from "@/shared/lib/authToken";
import { getPrisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        code: "INVALID_JSON",
      },
      {
        status: 400,
      },
    );
  }

  const validationResult = verifyEmailRequestSchema.safeParse(body);

  if (!validationResult.success) {
    return Response.json(
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

  const { token } = validationResult.data;
  const tokenHash = hashAuthToken(token);

  try {
    const prisma = getPrisma();
    const now = new Date();

    const result = await prisma.$transaction(async (transaction) => {
      const challenge = await transaction.authChallenge.findFirst({
        where: {
          type: AuthChallengeType.EMAIL_VERIFICATION,
          secretHash: tokenHash,
        },

        select: {
          id: true,
          userId: true,
          target: true,
          expiresAt: true,
          consumedAt: true,
          revokedAt: true,

          user: {
            select: {
              email: true,
              emailVerifiedAt: true,
            },
          },
        },
      });

      if (!challenge) {
        return {
          status: "INVALID",
        } as const;
      }

      if (challenge.target !== challenge.user.email) {
        return {
          status: "INVALID",
        } as const;
      }

      if (challenge.revokedAt) {
        return {
          status: "INVALID",
        } as const;
      }

      if (challenge.consumedAt) {
        if (challenge.user.emailVerifiedAt) {
          return {
            status: "ALREADY_VERIFIED",
          } as const;
        }

        return {
          status: "INVALID",
        } as const;
      }

      if (challenge.expiresAt.getTime() <= now.getTime()) {
        return {
          status: "EXPIRED",
        } as const;
      }

      const consumedChallenge = await transaction.authChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },

        data: {
          consumedAt: now,
        },
      });

      if (consumedChallenge.count !== 1) {
        return {
          status: "INVALID",
        } as const;
      }

      await transaction.user.update({
        where: {
          id: challenge.userId,
        },

        data: {
          emailVerifiedAt: challenge.user.emailVerifiedAt ?? now,
        },
      });

      await transaction.authChallenge.updateMany({
        where: {
          userId: challenge.userId,
          type: AuthChallengeType.EMAIL_VERIFICATION,

          id: {
            not: challenge.id,
          },

          consumedAt: null,
          revokedAt: null,
        },

        data: {
          revokedAt: now,
        },
      });

      return {
        status: "VERIFIED",
      } as const;
    });

    if (result.status === "VERIFIED") {
      return Response.json({
        code: "EMAIL_VERIFIED",
      });
    }

    if (result.status === "ALREADY_VERIFIED") {
      return Response.json({
        code: "EMAIL_ALREADY_VERIFIED",
      });
    }

    if (result.status === "EXPIRED") {
      return Response.json(
        {
          code: "VERIFICATION_TOKEN_EXPIRED",
        },
        {
          status: 410,
        },
      );
    }

    return Response.json(
      {
        code: "VERIFICATION_TOKEN_INVALID",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error("Email verification failed:", error);

    return Response.json(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
      },
    );
  }
}
