"use client";

import { OrdersList } from "./OrdersList";
import type { OrdersLoadState } from "../types";
import { useEffect, useState } from "react";
import { getOrders } from "../api/getOrders";

export function OrdersListContainer() {
  const [ordersLoadState, setOrdersLoadState] = useState<OrdersLoadState>({
    status: "loading",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getOrders(controller.signal)
      .then((orders) => {
        if (controller.signal.aborted) {
          return;
        }
        setOrdersLoadState({ status: "ready", orders });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setOrdersLoadState({ status: "error" });
      });

    return () => {
      controller.abort();
    };
  }, [attempt]);

  if (ordersLoadState.status === "loading") {
    return <OrdersList state="loading" />;
  }

  if (ordersLoadState.status === "error") {
    return (
      <OrdersList
        state="error"
        onRetryAction={() => {
          setOrdersLoadState({ status: "loading" });
          setAttempt((prev) => prev + 1);
        }}
      />
    );
  }

  return <OrdersList state="ready" orders={ordersLoadState.orders} />;
}
