import type { EmailValidationMessages } from "../../model";

import { createSignInSchema } from "./signInSchema";

const SIGN_IN_VALIDATION_CODES = {
  emailRequired: "EMAIL_REQUIRED",
  emailInvalid: "EMAIL_INVALID",
  passwordRequired: "PASSWORD_REQUIRED",
  passwordTooLong: "PASSWORD_TOO_LONG",
} satisfies EmailValidationMessages & {
  passwordRequired: string;
  passwordTooLong: string;
};

export const signInRequestSchema = createSignInSchema(
  SIGN_IN_VALIDATION_CODES,
);
