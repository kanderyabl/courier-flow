"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Text";
import { OrderCard } from "@/entities/order";

import type { OrdersListProps } from "../types";

import styles from "./OrdersList.module.css";

const SKELETON_IDS = ["one", "two", "three", "four"] as const;

function OrdersLoading({ label }: { label: string }) {
  return (
    <div className={styles.list} role="status" aria-busy="true">
      <span className={styles.srOnly}>{label}</span>

      {SKELETON_IDS.map((id) => (
        <Card key={id} className={styles.skeletonCard} padding="lg">
          <div className={styles.skeletonHeader}>
            <Skeleton width={88} height={20} />
            <Skeleton width={104} height={24} radius={999} />
          </div>

          <div className={styles.skeletonRoute}>
            <Skeleton width="42%" height={12} />
            <Skeleton width="88%" height={20} />
            <Skeleton width="38%" height={12} />
            <Skeleton width="72%" height={20} />
          </div>

          <Skeleton width="54%" height={14} />
        </Card>
      ))}
    </div>
  );
}

export function OrdersList(props: OrdersListProps) {
  const locale = useLocale();
  const t = useTranslations("order.list");
  const createOrderHref = `/${locale}/orders/new`;

  let content: React.ReactNode;

  if (props.state === "loading") {
    content = <OrdersLoading label={t("loadingLabel")} />;
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
  } else if (props.orders.length === 0) {
    content = (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
        icon="📦"
        action={
          <Button as="link" href={createOrderHref}>
            {t("actions.create")}
          </Button>
        }
      />
    );
  } else {
    content = (
      <ul className={styles.list} aria-label={t("title")}>
        {props.orders.map((order) => (
          <li key={order.id} className={styles.listItem}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className={styles.page}>
      <Container size="lg" className={styles.container}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <Text as="h1" variant="h1" className={styles.title}>
              {t("title")}
            </Text>
            <Text color="muted">{t("description")}</Text>
          </div>

          <Button
            as="link"
            href={createOrderHref}
            size="lg"
            className={styles.createButton}
          >
            <span aria-hidden="true">＋</span>
            {t("actions.create")}
          </Button>
        </header>

        {content}
      </Container>
    </main>
  );
}
