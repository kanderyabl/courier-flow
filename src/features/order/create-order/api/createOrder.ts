import type { OrderDetailsItem } from "@/entities/order";

import type { CreateOrderFormValues } from "../types";

type CreateOrderApiResponse = {
  order?: OrderDetailsItem;
  code?: string;
};

export async function createOrder(
  values: CreateOrderFormValues,
): Promise<OrderDetailsItem> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(values),
  });

  const data = (await response
    .json()
    .catch(() => null)) as CreateOrderApiResponse | null;

  if (!response.ok || !data?.order) {
    throw new Error(data?.code ?? "CREATE_ORDER_FAILED");
  }
  return data.order;
}
