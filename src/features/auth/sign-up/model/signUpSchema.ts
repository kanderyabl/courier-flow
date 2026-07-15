import { z } from "zod";

import type { SignUpValidationMessages } from "../types";

import { createEmailSchema, createPhoneSchema } from "../../model";

export function createSignUpSchema(messages: SignUpValidationMessages) {
  return z
    .object({
      role: z.literal("client"),

      name: z
        .string()
        .min(1, {
          error: messages.nameRequired,
        })
        .refine((value) => value.trim().length >= 2, {
          error: messages.nameTooShort,
        })
        .max(80, {
          error: messages.nameTooLong,
        }),

      email: createEmailSchema({
        emailRequired: messages.emailRequired,
        emailInvalid: messages.emailInvalid,
      }),

      phone: createPhoneSchema({
        phoneRequired: messages.phoneRequired,
        phoneInvalid: messages.phoneInvalid,
      }),

      password: z
        .string()
        .min(1, {
          error: messages.passwordRequired,
        })
        .min(8, {
          error: messages.passwordTooShort,
        })
        .max(64, {
          error: messages.passwordTooLong,
        })
        .regex(/[a-z]/, {
          error: messages.passwordLowercase,
        })
        .regex(/[A-Z]/, {
          error: messages.passwordUppercase,
        })
        .regex(/[0-9]/, {
          error: messages.passwordNumber,
        })
        .regex(/[^a-zA-Z0-9]/, {
          error: messages.passwordSpecial,
        }),

      confirmPassword: z.string().min(1, {
        error: messages.confirmPasswordRequired,
      }),

      acceptTerms: z.boolean().refine((value) => value, {
        error: messages.termsRequired,
      }),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      error: messages.passwordsDoNotMatch,
    });
}
