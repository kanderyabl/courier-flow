import type { OrderDetailsItem } from "@/entities/order";

type GetOrderApiResponse = {
  order?: OrderDetailsItem;
  code?: string;
};

export async function getOrder(
  id: string,
  signal: AbortSignal,
): Promise<OrderDetailsItem | null> {
  const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  const data = (await response
    .json()
    .catch(() => null)) as GetOrderApiResponse | null;

  if (response.status === 404) {
    return null;
  }

  if (!response.ok || !data?.order) {
    throw new Error(data?.code ?? "GET_ORDER_FAILED");
  }

  return data.order;
}
