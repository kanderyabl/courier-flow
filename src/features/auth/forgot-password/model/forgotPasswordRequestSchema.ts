import { z } from "zod";

import type { EmailValidationMessages } from "../../model";

import { createForgotPasswordSchema } from "./forgotPasswordSchema";

const FORGOT_PASSWORD_VALIDATION_CODES = {
  emailRequired: "EMAIL_REQUIRED",
  emailInvalid: "EMAIL_INVALID",
} satisfies EmailValidationMessages;

export const forgotPasswordRequestSchema = createForgotPasswordSchema(
  FORGOT_PASSWORD_VALIDATION_CODES,
).safeExtend({
  locale: z.unknown().optional(),
});
