import type { BadgeVariant } from "@/components/Badge";

import type { OrderStatus } from "../types";

export const ORDER_STATUSES = [
  "pending",
  "assigned",
  "in_progress",
  "delivered",
  "cancelled",
] as const;

export const ORDER_STATUS_BADGE_VARIANT = {
  pending: "neutral",
  assigned: "primary",
  in_progress: "warning",
  delivered: "success",
  cancelled: "danger",
} satisfies Record<OrderStatus, BadgeVariant>;
