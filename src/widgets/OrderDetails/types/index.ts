import type { OrderDetailsItem } from "@/entities/order";

type OrderDetailsLoadingProps = {
  state: "loading";
  order?: never;
  onRetryAction?: never;
};

type OrderDetailsErrorProps = {
  state: "error";
  order?: never;
  onRetryAction: () => void;
};

type OrderDetailsNotFoundProps = {
  state: "not-found";
  order?: never;
  onRetryAction?: never;
};

type OrderDetailsReadyProps = {
  state: "ready";
  order: OrderDetailsItem;
  onRetryAction?: never;
};

export type OrderDetailsProps =
  | OrderDetailsLoadingProps
  | OrderDetailsErrorProps
  | OrderDetailsNotFoundProps
  | OrderDetailsReadyProps;
