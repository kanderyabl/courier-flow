import type { z } from "zod";

import type { createOrderSchema } from "../model/createOrderSchema";

export type CreateOrderValidationMessages = {
  pickupAddressRequired: string;
  pickupAddressTooLong: string;

  deliveryAddressRequired: string;
  deliveryAddressTooLong: string;

  recipientNameRequired: string;
  recipientNameTooLong: string;

  recipientPhoneRequired: string;
  recipientPhoneInvalid: string;

  commentTooLong: string;
};

export type CreateOrderFormInput = z.input<
  ReturnType<typeof createOrderSchema>
>;

export type CreateOrderFormValues = z.output<
  ReturnType<typeof createOrderSchema>
>;

export type CreateOrderFormProps = {
  autoFocus?: boolean;
  cancelHref?: string;
  onSubmitAction: (values: CreateOrderFormValues) => Promise<void>;
};
