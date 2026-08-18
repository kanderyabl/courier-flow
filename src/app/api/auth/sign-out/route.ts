import { type NextRequest, NextResponse } from "next/server";

import { hashAuthToken } from "@/shared/lib/authToken";
import {
  createNoStoreJsonResponse as jsonResponse,
  isTrustedOrigin,
} from "@/shared/lib/http";
import { getPrisma } from "@/shared/lib/prisma";
import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/shared/lib/session";

export const runtime = "nodejs";

function noContentResponse(): NextResponse {
  const response = new NextResponse(null, { status: 204 });

  response.headers.set("Cache-Control", "no-store");
  clearSessionCookie(response);

  return response;
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return jsonResponse({ code: "FORBIDDEN" }, 403);
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

    return jsonResponse({ code: "INTERNAL_SERVER_ERROR" }, 500);
  }
}
