import { z } from "zod";

import type { CreateOrderValidationMessages } from "../types";
import { createPhoneSchema } from "@/features/auth/model";

export function createOrderSchema(messages: CreateOrderValidationMessages) {
  return z.strictObject({
    pickupAddress: z
      .string()
      .trim()
      .min(1, { error: messages.pickupAddressRequired })
      .max(500, { error: messages.pickupAddressTooLong }),

    deliveryAddress: z
      .string()
      .trim()
      .min(1, { error: messages.deliveryAddressRequired })
      .max(500, { error: messages.deliveryAddressTooLong }),

    recipientName: z
      .string()
      .trim()
      .min(1, { error: messages.recipientNameRequired })
      .max(80, { error: messages.recipientNameTooLong }),

    recipientPhone: createPhoneSchema({
      phoneRequired: messages.recipientPhoneRequired,
      phoneInvalid: messages.recipientPhoneInvalid,
    }),

    comment: z
      .string()
      .trim()
      .max(1000, { error: messages.commentTooLong })
      .nullish()
      .transform((value) =>
        value === "" || value === undefined || value === null ? null : value,
      ),
  });
}
