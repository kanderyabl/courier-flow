import { z } from "zod";

import type { EmailValidationMessages } from "../../model";

import { createChangeEmailSchema } from "./changeEmailSchema";

const CHANGE_EMAIL_VALIDATION_CODES = {
  emailRequired: "EMAIL_REQUIRED",
  emailInvalid: "EMAIL_INVALID",
} satisfies EmailValidationMessages;

export const changeEmailRequestSchema = createChangeEmailSchema(
  CHANGE_EMAIL_VALIDATION_CODES,
).safeExtend({
  locale: z.unknown().optional(),
});
