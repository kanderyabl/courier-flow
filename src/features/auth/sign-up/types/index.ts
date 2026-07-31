import type { z } from "zod";

import type { createSignUpSchema } from "../model/signUpSchema";
import type {
  EmailValidationMessages,
  PasswordValidationMessages,
  PhoneValidationMessages,
} from "../../model";

export type SignUpValidationMessages = PhoneValidationMessages &
  EmailValidationMessages &
  PasswordValidationMessages & {
    nameRequired: string;
    nameTooShort: string;
    nameTooLong: string;

    emailRequired: string;
    emailInvalid: string;

    phoneRequired: string;
    phoneInvalid: string;

    confirmPasswordRequired: string;
    passwordsDoNotMatch: string;

    termsRequired: string;
  };

export type SignUpFormValues = z.infer<ReturnType<typeof createSignUpSchema>>;

export type SignUpFormProps = {
  onSubmitAction?: (values: SignUpFormValues) => void | Promise<void>;
};
