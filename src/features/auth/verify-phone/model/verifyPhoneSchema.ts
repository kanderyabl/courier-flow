import { z } from "zod";

import type { VerifyPhoneValidationMessages } from "../types";

export function createVerifyPhoneSchema(
  messages: VerifyPhoneValidationMessages,
  codeLength: number,
) {
  return z.object({
    code: z
      .string()
      .min(1, {
        error: messages.codeRequired,
      })
      .length(codeLength, {
        error: messages.codeLength,
      })
      .regex(/^\d+$/, {
        error: messages.codeDigitsOnly,
      }),
  });
}
