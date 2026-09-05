import {
  createNoStoreJsonResponse as jsonResponse,
  isJsonRequest,
  isTrustedOrigin,
  readLimitedJsonBody,
} from "@/shared/lib/http";
import { MAX_CREATE_ORDER_BODY_BYTES } from "./constants";
import { createOrderRequestSchema } from "@/features/order/create-order/model/createOrderRequestSchema";
import type { NextRequest } from "next/server";
import { getCurrentSession } from "@/shared/lib/session";
import { UserRole, OrderStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/shared/lib/prisma";
import { serializeOrderStatus } from "./serializeOrderStatus";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return jsonResponse(
      {
        code: "INVALID_ORIGIN",
      },
      403,
    );
  }

  if (!isJsonRequest(request)) {
    return jsonResponse(
      {
        code: "UNSUPPORTED_MEDIA_TYPE",
      },
      415,
    );
  }

  let bodyResult: Awaited<ReturnType<typeof readLimitedJsonBody>>;

  try {
    bodyResult = await readLimitedJsonBody(
      request,
      MAX_CREATE_ORDER_BODY_BYTES,
    );
  } catch (error) {
    console.error("Reading create-order request body failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }

  if (!bodyResult.ok) {
    return jsonResponse(
      {
        code: bodyResult.code,
      },
      bodyResult.code === "PAYLOAD_TOO_LARGE" ? 413 : 400,
    );
  }

  const validationResult = createOrderRequestSchema.safeParse(bodyResult.body);

  if (!validationResult.success) {
    return jsonResponse(
      {
        code: "VALIDATION_ERROR",

        issues: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          code: issue.message,
        })),
      },
      400,
    );
  }

  let session: Awaited<ReturnType<typeof getCurrentSession>>;

  try {
    session = await getCurrentSession(request);
  } catch (error) {
    console.error("Getting session for create-order failed:", error);

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

  if (!session.user.emailVerifiedAt) {
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

    const order = await prisma.order.create({
      data: {
        pickupAddress: validationResult.data.pickupAddress,
        deliveryAddress: validationResult.data.deliveryAddress,
        recipientName: validationResult.data.recipientName,
        recipientPhone: validationResult.data.recipientPhone,
        comment: validationResult.data.comment,
        ownerId: session.user.id,
        status: OrderStatus.PENDING,
        statusHistory: {
          create: {
            status: OrderStatus.PENDING,
          },
        },
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

    return jsonResponse(
      {
        order: {
          ...order,
          status: serializeOrderStatus(order.status),
        },
      },
      201,
    );
  } catch (error) {
    console.error("Creating order failed:", error);
    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}

export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getCurrentSession>>;

  try {
    session = await getCurrentSession(request);
  } catch (error) {
    console.error("Getting session for get-orders failed:", error);
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

  if (!session.user.emailVerifiedAt) {
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

    const orders = await prisma.order.findMany({
      where: {
        ownerId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        pickupAddress: true,
        deliveryAddress: true,
        status: true,
        createdAt: true,
      },
    });

    return jsonResponse(
      {
        orders: orders.map((order) => ({
          ...order,
          status: serializeOrderStatus(order.status),
        })),
      },
      200,
    );
  } catch (error) {
    console.error("Getting orders failed:", error);

    return jsonResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
      },
      500,
    );
  }
}
