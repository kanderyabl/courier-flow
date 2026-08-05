import { z } from "zod";

export const resendEmailVerificationRequestSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(1, {
        error: "TOKEN_REQUIRED",
      })
      .max(512, {
        error: "TOKEN_TOO_LONG",
      })
      .optional(),
  })
  .strict();

export type ResendEmailVerificationRequest = z.infer<
  typeof resendEmailVerificationRequestSchema
>;
