"use client";

import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { Card } from "@/components/Card";
import { Text } from "@/components/Text";

import type { OrderCardProps } from "../../types";
import { OrderStatusBadge } from "../OrderStatusBadge";

import styles from "./OrderCard.module.css";

export function OrderCard({ order }: OrderCardProps) {
  const locale = useLocale();
  const format = useFormatter();
  const labels = useTranslations("order.labels");
  const t = useTranslations("order.card");

  const shortId = order.id.slice(0, 8).toUpperCase();
  const createdAt = format.dateTime(new Date(order.createdAt), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Link
      href={`/${locale}/orders/${order.id}`}
      className={styles.link}
      aria-label={`${t("viewDetails")} #${shortId}`}
    >
      <Card className={styles.card} padding="lg">
        <div className={styles.header}>
          <Text as="h2" variant="label" className={styles.orderId}>
            #{shortId}
          </Text>

          <OrderStatusBadge status={order.status} size="sm" />
        </div>

        <div className={styles.route}>
          <div className={styles.routeItem}>
            <span className={styles.pickupMarker} aria-hidden="true" />

            <div className={styles.addressContent}>
              <Text as="span" variant="caption" color="muted">
                {labels("pickupAddress")}
              </Text>
              <Text className={styles.address}>{order.pickupAddress}</Text>
            </div>
          </div>

          <div className={styles.routeItem}>
            <span className={styles.deliveryMarker} aria-hidden="true" />

            <div className={styles.addressContent}>
              <Text as="span" variant="caption" color="muted">
                {labels("deliveryAddress")}
              </Text>
              <Text className={styles.address}>{order.deliveryAddress}</Text>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <Text as="span" variant="caption" color="muted">
            <time dateTime={order.createdAt}>
              {t("createdAt", { date: createdAt })}
            </time>
          </Text>

          <span className={styles.details} aria-hidden="true">
            {t("viewDetails")} <span className={styles.arrow}>→</span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
