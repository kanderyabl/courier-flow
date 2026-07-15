import { z } from "zod";

export type EmailValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createEmailSchema(messages: EmailValidationMessages) {
  return z
    .string()
    .trim()
    .min(1, {
      error: messages.emailRequired,
    })
    .pipe(
      z.email({
        error: messages.emailInvalid,
      }),
    )
    .transform(normalizeEmail);
}
