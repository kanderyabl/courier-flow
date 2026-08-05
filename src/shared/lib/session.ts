import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import { createAuthToken, hashAuthToken } from "@/shared/lib/authToken";
import { getPrisma } from "@/shared/lib/prisma";

export const SESSION_COOKIE_NAME = "courier_flow_session";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type CreatedSessionToken = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

export function createSessionToken(): CreatedSessionToken {
  const { token, tokenHash } = createAuthToken();

  return {
    token,
    tokenHash,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  };
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashAuthToken(sessionToken);
  const prisma = getPrisma();

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },

    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.revokedAt) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    id: session.id,
    expiresAt: session.expiresAt,
    user: session.user,
  };
}
