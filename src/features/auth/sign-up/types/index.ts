import type { z } from "zod";

import type { createSignUpSchema } from "../model/signUpSchema";

export type SignUpValidationMessages = {
  nameRequired: string;
  nameTooShort: string;
  nameTooLong: string;

  emailRequired: string;
  emailInvalid: string;

  phoneRequired: string;
  phoneInvalid: string;

  passwordRequired: string;
  passwordTooShort: string;
  passwordTooLong: string;
  passwordLowercase: string;
  passwordUppercase: string;
  passwordNumber: string;
  passwordSpecial: string;

  confirmPasswordRequired: string;
  passwordsDoNotMatch: string;

  termsRequired: string;
};

export type SignUpFormValues = z.infer<ReturnType<typeof createSignUpSchema>>;

export type SignUpFormProps = {
  onSubmit?: (values: SignUpFormValues) => void | Promise<void>;
};
