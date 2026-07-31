import { z } from "zod";

import {
  createPasswordSchema,
  type PasswordValidationMessages,
} from "../../model";

export type ResetPasswordValidationMessages = PasswordValidationMessages & {
  confirmPasswordRequired: string;
  passwordsDoNotMatch: string;
};

export function createResetPasswordSchema(
  messages: ResetPasswordValidationMessages,
) {
  return z
    .object({
      password: createPasswordSchema(messages),

      confirmPassword: z.string().min(1, {
        error: messages.confirmPasswordRequired,
      }),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      path: ["confirmPassword"],
      error: messages.passwordsDoNotMatch,
    });
}
