import { z } from "zod";
import type { NextRequest } from "next/server";
import { createNoStoreJsonResponse as jsonResponse } from "@/shared/lib/http";
import { getCurrentSession } from "@/shared/lib/session";
import { UserRole } from "@/generated/prisma/client";
import { getPrisma } from "@/shared/lib/prisma";
import { serializeOrderStatus } from "../serializeOrderStatus";

export const runtime = "nodejs";

type OrderRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const orderIdSchema = z.uuid({
  error: "INVALID_ORDER_ID",
});

export async function GET(request: NextRequest, context: OrderRouteContext) {
  const { id } = await context.params;
  const validationResult = orderIdSchema.safeParse(id);

  if (!validationResult.success) {
    return jsonResponse(
      {
        code: "INVALID_ORDER_ID",
      },
      400,
    );
  }

  let session: Awaited<ReturnType<typeof getCurrentSession>>;

  try {
    session = await getCurrentSession(request);
  } catch (error) {
    console.error("Getting session for get-order failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }

  if (!session) {
    return jsonResponse(
      {
        code: "UNAUTHORIZED",
      },
      401,
    );
  }

  if (session.user.emailVerifiedAt === null) {
    return jsonResponse(
      {
        code: "EMAIL_VERIFICATION_REQUIRED",
      },
      403,
    );
  }

  if (session.user.role !== UserRole.CLIENT) {
    return jsonResponse(
      {
        code: "FORBIDDEN",
      },
      403,
    );
  }

  try {
    const prisma = getPrisma();

    const order = await prisma.order.findFirst({
      where: {
        id: validationResult.data,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        pickupAddress: true,
        deliveryAddress: true,
        recipientName: true,
        recipientPhone: true,
        comment: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!order) {
      return jsonResponse(
        {
          code: "ORDER_NOT_FOUND",
        },
        404,
      );
    }

    return jsonResponse(
      {
        order: {
          ...order,
          status: serializeOrderStatus(order.status),
        },
      },
      200,
    );
  } catch (error) {
    console.error("Fetching order failed:", error);
    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}
