import { z } from "zod";

import {
  createPhoneSchema,
  type PhoneValidationMessages,
} from "@/features/auth/model";

export type ChangePhoneValidationMessages = PhoneValidationMessages;

export function createChangePhoneSchema(
  messages: ChangePhoneValidationMessages,
) {
  return z.object({
    phone: createPhoneSchema(messages),
  });
}
