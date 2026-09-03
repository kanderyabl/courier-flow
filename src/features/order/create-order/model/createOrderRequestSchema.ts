import type { CreateOrderValidationMessages } from "../types";
import { createOrderSchema } from "./createOrderSchema";

const CREATE_ORDER_VALIDATION_CODES = {
  pickupAddressRequired: "PICKUP_ADDRESS_REQUIRED",
  pickupAddressTooLong: "PICKUP_ADDRESS_TOO_LONG",
  deliveryAddressRequired: "DELIVERY_ADDRESS_REQUIRED",
  deliveryAddressTooLong: "DELIVERY_ADDRESS_TOO_LONG",
  recipientNameRequired: "RECIPIENT_NAME_REQUIRED",
  recipientNameTooLong: "RECIPIENT_NAME_TOO_LONG",
  recipientPhoneRequired: "RECIPIENT_PHONE_REQUIRED",
  recipientPhoneInvalid: "RECIPIENT_PHONE_INVALID",
  commentTooLong: "COMMENT_TOO_LONG",
} satisfies CreateOrderValidationMessages;

export const createOrderRequestSchema = createOrderSchema(
  CREATE_ORDER_VALIDATION_CODES,
);
