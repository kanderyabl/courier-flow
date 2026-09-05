"use client";

import { useLocale } from "next-intl";

import { Container } from "@/components/Container";
import { CreateOrderForm } from "@/features/order/create-order";

import type { CreateOrderPageProps } from "../types";

import styles from "./CreateOrderPage.module.css";

export function CreateOrderPage({
  cancelHref,
  ...formProps
}: CreateOrderPageProps) {
  const locale = useLocale();

  return (
    <main className={styles.page}>
      <Container size="md">
        <CreateOrderForm
          {...formProps}
          cancelHref={cancelHref ?? `/${locale}/orders`}
        />
      </Container>
    </main>
  );
}
