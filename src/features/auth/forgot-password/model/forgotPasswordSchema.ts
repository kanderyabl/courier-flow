import { z } from "zod";

import { createEmailSchema, type EmailValidationMessages } from "../../model";

export function createForgotPasswordSchema(messages: EmailValidationMessages) {
  return z.object({
    email: createEmailSchema(messages),
  });
}
