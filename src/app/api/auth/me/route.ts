import { type NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/shared/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request);

    if (!session) {
      return NextResponse.json(
        {
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json({
      user: session.user,
    });
  } catch (error) {
    console.error("Get current user failed:", error);

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
