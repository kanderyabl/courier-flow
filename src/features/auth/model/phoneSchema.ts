import { z } from "zod";

export type PhoneValidationMessages = {
  phoneRequired: string;
  phoneInvalid: string;
};

export function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, "");
}

export function createPhoneSchema(messages: PhoneValidationMessages) {
  return z
    .string()
    .trim()
    .min(1, {
      error: messages.phoneRequired,
    })
    .transform(normalizePhone)
    .refine((phone) => /^\+[1-9]\d{7,14}$/.test(phone), {
      error: messages.phoneInvalid,
    });
}
