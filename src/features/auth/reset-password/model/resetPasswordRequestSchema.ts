import { z } from "zod";

import {
  createPasswordSchema,
  type PasswordValidationMessages,
} from "../../model";

const RESET_PASSWORD_VALIDATION_CODES = {
  passwordRequired: "PASSWORD_REQUIRED",
  passwordTooShort: "PASSWORD_TOO_SHORT",
  passwordTooLong: "PASSWORD_TOO_LONG",
  passwordLowercase: "PASSWORD_LOWERCASE_REQUIRED",
  passwordUppercase: "PASSWORD_UPPERCASE_REQUIRED",
  passwordNumber: "PASSWORD_NUMBER_REQUIRED",
  passwordSpecial: "PASSWORD_SPECIAL_REQUIRED",
} satisfies PasswordValidationMessages;

export const resetPasswordRequestSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, {
      error: "RESET_TOKEN_REQUIRED",
    })
    .max(128, {
      error: "RESET_TOKEN_INVALID",
    }),

  password: createPasswordSchema(RESET_PASSWORD_VALIDATION_CODES),
});
