import { z } from "zod";

import { createEmailSchema, type EmailValidationMessages } from "../../model";

type SignInValidationMessages = EmailValidationMessages & {
  passwordRequired: string;
  passwordTooLong: string;
};

export function createSignInSchema(messages: SignInValidationMessages) {
  return z.object({
    email: createEmailSchema(messages),

    password: z
      .string()
      .min(1, {
        error: messages.passwordRequired,
      })
      .max(64, {
        error: messages.passwordTooLong,
      }),
  });
}
