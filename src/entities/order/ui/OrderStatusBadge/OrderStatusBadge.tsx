import { useTranslations } from "next-intl";

import { Badge } from "@/components/Badge";

import { ORDER_STATUS_BADGE_VARIANT } from "../../constants";
import type { OrderStatusBadgeProps } from "../../types";

export function OrderStatusBadge({ status, ...props }: OrderStatusBadgeProps) {
  const t = useTranslations("order.status");

  return (
    <Badge variant={ORDER_STATUS_BADGE_VARIANT[status]} {...props}>
      {t(status)}
    </Badge>
  );
}
