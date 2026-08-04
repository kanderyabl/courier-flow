import { z } from "zod";

export const verifyEmailRequestSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, {
      error: "TOKEN_REQUIRED",
    })
    .max(512, {
      error: "TOKEN_INVALID",
    }),
});

export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
