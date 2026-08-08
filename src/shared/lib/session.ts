import "server-only";

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/shared/config/auth";
import { createAuthToken, hashAuthToken } from "@/shared/lib/authToken";
import { getPrisma } from "@/shared/lib/prisma";

export { SESSION_COOKIE_NAME } from "@/shared/config/auth";

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

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionByToken(sessionToken: string | undefined) {
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

export async function getCurrentSession(request: NextRequest) {
  return getSessionByToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
}

export async function getCurrentSessionFromCookies() {
  const cookieStore = await cookies();

  return getSessionByToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
