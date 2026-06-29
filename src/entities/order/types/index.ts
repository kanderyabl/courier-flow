import type { ComponentProps } from "react";
import { Badge } from "@/components/Badge/ui/Badge";
import { ORDER_STATUSES } from "../constants";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderStatusBadgeProps = Omit<
  ComponentProps<typeof Badge>,
  "children" | "variant"
> & {
  status: OrderStatus;
};
