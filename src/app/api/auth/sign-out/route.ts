import { type NextRequest, NextResponse } from "next/server";

import { hashAuthToken } from "@/shared/lib/authToken";
import { getPrisma } from "@/shared/lib/prisma";
import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/shared/lib/session";

export const runtime = "nodejs";

function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    const trustedOrigins = new Set([request.nextUrl.origin]);
    const configuredAppUrl = process.env.APP_URL?.trim();

    if (configuredAppUrl) {
      trustedOrigins.add(new URL(configuredAppUrl).origin);
    }

    return trustedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

function noContentResponse(): NextResponse {
  const response = new NextResponse(null, { status: 204 });

  response.headers.set("Cache-Control", "no-store");
  clearSessionCookie(response);

  return response;
}

function jsonErrorResponse(code: string, status: number): NextResponse {
  const response = NextResponse.json({ code }, { status });

  response.headers.set("Cache-Control", "no-store");

  return response;
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return jsonErrorResponse("FORBIDDEN", 403);
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return noContentResponse();
  }

  try {
    await getPrisma().session.updateMany({
      where: {
        tokenHash: hashAuthToken(sessionToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return noContentResponse();
  } catch (error) {
    console.error("Sign out failed:", error);

    return jsonErrorResponse("INTERNAL_SERVER_ERROR", 500);
  }
}
