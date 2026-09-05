"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import {
  createOrder,
  type CreateOrderFormValues,
} from "@/features/order/create-order";

import { CreateOrderPage } from "./CreateOrderPage";

export function CreateOrderPageContainer() {
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (values: CreateOrderFormValues): Promise<void> => {
    const order = await createOrder(values);

    router.push(`/${locale}/orders/${order.id}`);
  };

  return <CreateOrderPage onSubmitAction={handleSubmit} />;
}
