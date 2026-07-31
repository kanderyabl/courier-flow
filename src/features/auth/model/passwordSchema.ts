import { z } from "zod";

export type PasswordValidationMessages = {
  passwordRequired: string;
  passwordTooShort: string;
  passwordTooLong: string;
  passwordLowercase: string;
  passwordUppercase: string;
  passwordNumber: string;
  passwordSpecial: string;
};

export function createPasswordSchema(messages: PasswordValidationMessages) {
  return z
    .string()
    .min(1, {
      error: messages.passwordRequired,
    })
    .min(8, {
      error: messages.passwordTooShort,
    })
    .max(64, {
      error: messages.passwordTooLong,
    })
    .regex(/[a-z]/, {
      error: messages.passwordLowercase,
    })
    .regex(/[A-Z]/, {
      error: messages.passwordUppercase,
    })
    .regex(/[0-9]/, {
      error: messages.passwordNumber,
    })
    .regex(/[^a-zA-Z0-9]/, {
      error: messages.passwordSpecial,
    });
}
