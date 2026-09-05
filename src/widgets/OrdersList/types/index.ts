import type { OrderListItem } from "@/entities/order";

type OrdersListLoadingProps = {
  state: "loading";
  orders?: never;
  onRetryAction?: never;
};

type OrdersListErrorProps = {
  state: "error";
  orders?: never;
  onRetryAction: () => void;
};

type OrdersListReadyProps = {
  state: "ready";
  orders: readonly OrderListItem[];
  onRetryAction?: never;
};

export type OrdersListProps =
  | OrdersListLoadingProps
  | OrdersListErrorProps
  | OrdersListReadyProps;

export type OrdersLoadState =
  | { status: "loading" }
  | { status: "ready"; orders: OrderListItem[] }
  | { status: "error" };
