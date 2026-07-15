import { z } from "zod";

import { createPhoneSchema, type PhoneValidationMessages } from "../../model";

export function createChangePhoneSchema(messages: PhoneValidationMessages) {
  return z.object({
    phone: createPhoneSchema(messages),
  });
}
