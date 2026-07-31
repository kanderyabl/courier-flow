import { z } from "zod";

import {
  createEmailSchema,
  createPasswordSchema,
  createPhoneSchema,
} from "../../model";

import type { SignUpValidationMessages } from "../types";

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

      password: createPasswordSchema({
        passwordRequired: messages.passwordRequired,
        passwordTooShort: messages.passwordTooShort,
        passwordTooLong: messages.passwordTooLong,
        passwordLowercase: messages.passwordLowercase,
        passwordUppercase: messages.passwordUppercase,
        passwordNumber: messages.passwordNumber,
        passwordSpecial: messages.passwordSpecial,
      }),

      confirmPassword: z.string().min(1, {
        error: messages.confirmPasswordRequired,
      }),

      acceptTerms: z.boolean().refine((value) => value, {
        error: messages.termsRequired,
      }),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      path: ["confirmPassword"],
      error: messages.passwordsDoNotMatch,
    });
}
