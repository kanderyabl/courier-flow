import type { NextRequest } from "next/server";

import { createNoStoreJsonResponse as jsonResponse } from "@/shared/lib/http";
import { getCurrentSession } from "@/shared/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request);

    if (!session) {
      return jsonResponse(
        {
          code: "UNAUTHORIZED",
        },
        401,
      );
    }

    return jsonResponse(
      {
        user: session.user,
      },
      200,
    );
  } catch (error) {
    console.error("Get current user failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}
