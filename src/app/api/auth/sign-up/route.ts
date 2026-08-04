import { AuthChallengeType, Prisma, UserRole } from "@/generated/prisma/client";

import { signUpRequestSchema } from "@/features/auth/sign-up/model/signUpRequestSchema";
import { createAuthToken } from "@/shared/lib/authToken";
import { hashPassword } from "@/shared/lib/password";
import { getPrisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

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

  const validationResult = signUpRequestSchema.safeParse(body);

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

  const { name, email, phone, password } = validationResult.data;

  try {
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
      return Response.json(
        {
          code: "EMAIL_ALREADY_IN_USE",
        },
        {
          status: 409,
        },
      );
    }

    if (existingUser?.phone === phone) {
      return Response.json(
        {
          code: "PHONE_ALREADY_IN_USE",
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash = await hashPassword(password);

    const { token: verificationToken, tokenHash: verificationTokenHash } =
      createAuthToken();

    const verificationExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TTL_MS,
    );

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
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return Response.json(
      {
        user,

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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          code: "ACCOUNT_ALREADY_EXISTS",
        },
        {
          status: 409,
        },
      );
    }

    console.error("Sign-up failed:", error);

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
