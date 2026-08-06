import { z } from "zod";

import type { SignUpValidationMessages } from "../types";

import { createSignUpSchema } from "./signUpSchema";

const SIGN_UP_VALIDATION_CODES = {
  nameRequired: "NAME_REQUIRED",
  nameTooShort: "NAME_TOO_SHORT",
  nameTooLong: "NAME_TOO_LONG",

  emailRequired: "EMAIL_REQUIRED",
  emailInvalid: "EMAIL_INVALID",

  phoneRequired: "PHONE_REQUIRED",
  phoneInvalid: "PHONE_INVALID",

  passwordRequired: "PASSWORD_REQUIRED",
  passwordTooShort: "PASSWORD_TOO_SHORT",
  passwordTooLong: "PASSWORD_TOO_LONG",
  passwordLowercase: "PASSWORD_LOWERCASE_REQUIRED",
  passwordUppercase: "PASSWORD_UPPERCASE_REQUIRED",
  passwordNumber: "PASSWORD_NUMBER_REQUIRED",
  passwordSpecial: "PASSWORD_SPECIAL_REQUIRED",

  confirmPasswordRequired: "CONFIRM_PASSWORD_REQUIRED",
  passwordsDoNotMatch: "PASSWORDS_DO_NOT_MATCH",

  termsRequired: "TERMS_REQUIRED",
} satisfies SignUpValidationMessages;

export const signUpRequestSchema = createSignUpSchema(
  SIGN_UP_VALIDATION_CODES,
).safeExtend({
  locale: z.unknown().optional(),
});
