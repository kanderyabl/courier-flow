import { OrderStatus as PrismaOrderStatus } from "@/generated/prisma/client";

const orderStatusMap = {
  [PrismaOrderStatus.PENDING]: "pending",
  [PrismaOrderStatus.ASSIGNED]: "assigned",
  [PrismaOrderStatus.IN_PROGRESS]: "in_progress",
  [PrismaOrderStatus.DELIVERED]: "delivered",
  [PrismaOrderStatus.CANCELLED]: "cancelled",
} as const satisfies Record<PrismaOrderStatus, string>;

export function serializeOrderStatus(status: PrismaOrderStatus) {
  return orderStatusMap[status];
}
