import type { OrderListItem } from "@/entities/order";

type GetOrdersApiResponse = {
  orders?: OrderListItem[];
  code?: string;
};

export async function getOrders(signal: AbortSignal): Promise<OrderListItem[]> {
  const response = await fetch("/api/orders", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  const data = (await response
    .json()
    .catch(() => null)) as GetOrdersApiResponse | null;

  if (!response.ok || !Array.isArray(data?.orders)) {
    throw new Error(data?.code ?? "GET_ORDERS_FAILED");
  }

  return data.orders;
}
