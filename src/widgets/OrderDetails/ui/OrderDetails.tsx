"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Text";
import { OrderStatusBadge } from "@/entities/order";

import type { OrderDetailsProps } from "../types";

import styles from "./OrderDetails.module.css";

function DetailsLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" className={styles.loading}>
      <span className={styles.srOnly}>{label}</span>

      <div className={styles.loadingHeader}>
        <div className={styles.loadingTitle}>
          <Skeleton width={190} height={34} />
          <Skeleton width={270} height={18} />
        </div>
        <Skeleton width={110} height={28} radius={999} />
      </div>

      <Card padding="lg" className={styles.loadingCard}>
        <Skeleton width={90} height={24} />
        <div className={styles.loadingGrid}>
          <Skeleton width="75%" height={18} />
          <Skeleton width="68%" height={18} />
          <Skeleton width="56%" height={18} />
          <Skeleton width="48%" height={18} />
          <Skeleton width="82%" height={18} />
          <Skeleton width="60%" height={18} />
        </div>
      </Card>
    </div>
  );
}

export function OrderDetails(props: OrderDetailsProps) {
  const locale = useLocale();
  const format = useFormatter();
  const labels = useTranslations("order.labels");
  const t = useTranslations("order.details");
  const ordersHref = `/${locale}/orders`;

  let content: React.ReactNode;

  if (props.state === "loading") {
    content = <DetailsLoading label={t("loadingLabel")} />;
  } else if (props.state === "error") {
    content = (
      <EmptyState
        role="alert"
        title={t("error.title")}
        description={t("error.description")}
        icon="⚠️"
        action={
          <Button type="button" variant="secondary" onClick={props.onRetryAction}>
            {t("actions.retry")}
          </Button>
        }
      />
    );
  } else if (props.state === "not-found") {
    content = (
      <EmptyState
        title={t("notFound.title")}
        description={t("notFound.description")}
        icon="🔎"
        action={
          <Button as="link" href={ordersHref} variant="secondary">
            {t("actions.backToOrders")}
          </Button>
        }
      />
    );
  } else {
    const { order } = props;
    const shortId = order.id.slice(0, 8).toUpperCase();
    const createdAt = format.dateTime(new Date(order.createdAt), {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const updatedAt = format.dateTime(new Date(order.updatedAt), {
      dateStyle: "medium",
      timeStyle: "short",
    });

    content = (
      <div className={styles.ready}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <Text as="span" variant="label" color="primary">
              #{shortId}
            </Text>
            <Text as="h1" variant="h1" className={styles.title}>
              {t("title")}
            </Text>
            <Text color="muted">{t("description")}</Text>
          </div>

          <OrderStatusBadge status={order.status} />
        </header>

        <Card padding="lg" className={styles.card}>
          <dl className={styles.detailsGrid}>
            <div className={styles.wideDetail}>
              <dt className={styles.term}>{labels("pickupAddress")}</dt>
              <dd className={styles.addressValue}>
                <span className={styles.pickupMarker} aria-hidden="true" />
                {order.pickupAddress}
              </dd>
            </div>

            <div className={styles.wideDetail}>
              <dt className={styles.term}>{labels("deliveryAddress")}</dt>
              <dd className={styles.addressValue}>
                <span className={styles.deliveryMarker} aria-hidden="true" />
                {order.deliveryAddress}
              </dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.term}>{labels("recipientName")}</dt>
              <dd className={styles.value}>{order.recipientName}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.term}>{labels("recipientPhone")}</dt>
              <dd className={styles.value}>
                <a className={styles.phone} href={`tel:${order.recipientPhone}`}>
                  {order.recipientPhone}
                </a>
              </dd>
            </div>

            <div className={styles.wideDetail}>
              <dt className={styles.term}>{labels("comment")}</dt>
              <dd className={styles.value}>
                {order.comment || (
                  <span className={styles.mutedValue}>{t("noComment")}</span>
                )}
              </dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.term}>{labels("createdAt")}</dt>
              <dd className={styles.value}>
                <time dateTime={order.createdAt}>{createdAt}</time>
              </dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.term}>{labels("updatedAt")}</dt>
              <dd className={styles.value}>
                <time dateTime={order.updatedAt}>{updatedAt}</time>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <Container size="md" className={styles.container}>
        <Button
          as="link"
          href={ordersHref}
          variant="ghost"
          size="sm"
          className={styles.backLink}
        >
          <span aria-hidden="true">←</span>
          {t("actions.backToOrders")}
        </Button>

        {content}
      </Container>
    </main>
  );
}
