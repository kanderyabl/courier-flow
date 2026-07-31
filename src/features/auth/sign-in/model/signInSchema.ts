import { z } from "zod";

import { createEmailSchema, type EmailValidationMessages } from "../../model";

type SignInValidationMessages = EmailValidationMessages & {
  passwordRequired: string;
};

export function createSignInSchema(messages: SignInValidationMessages) {
  return z.object({
    email: createEmailSchema(messages),

    password: z.string().min(1, {
      error: messages.passwordRequired,
    }),
  });
}
