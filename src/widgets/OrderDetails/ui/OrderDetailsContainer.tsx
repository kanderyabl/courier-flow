"use client";

import { useState, useEffect } from "react";
import type {
  OrderDetailsContainerProps,
  OrderDetailsLoadState,
} from "../types";
import { getOrder } from "../api";
import { OrderDetails } from "./OrderDetails";

export function OrderDetailsContainer({ orderId }: OrderDetailsContainerProps) {
  const [orderDetailsLoadState, setOrderDetailsLoadState] =
    useState<OrderDetailsLoadState>({
      status: "loading",
    });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getOrder(orderId, controller.signal)
      .then((order) => {
        if (controller.signal.aborted) {
          return;
        }

        if (order === null) {
          setOrderDetailsLoadState({ status: "not-found" });
          return;
        }

        setOrderDetailsLoadState({ status: "ready", order });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setOrderDetailsLoadState({ status: "error" });
      });
    return () => {
      controller.abort();
    };
  }, [attempt, orderId]);

  return (
    <>
      {orderDetailsLoadState.status === "loading" && (
        <OrderDetails state="loading" />
      )}
      {orderDetailsLoadState.status === "not-found" && (
        <OrderDetails state="not-found" />
      )}
      {orderDetailsLoadState.status === "ready" && (
        <OrderDetails state="ready" order={orderDetailsLoadState.order} />
      )}
      {orderDetailsLoadState.status === "error" && (
        <OrderDetails
          state="error"
          onRetryAction={() => {
            setOrderDetailsLoadState({ status: "loading" });
            setAttempt((current) => current + 1);
          }}
        />
      )}
    </>
  );
}
