import type { z } from "zod";
import type { createVerifyPhoneSchema } from "../model/verifyPhoneSchema";

export type VerifyPhoneValidationMessages = {
  codeRequired: string;
  codeLength: string;
  codeDigitsOnly: string;
};

export type VerifyPhoneFormValues = z.infer<
  ReturnType<typeof createVerifyPhoneSchema>
>;

export type VerifyPhoneFormProps = {
  maskedPhone?: string;
  codeLength?: number;
  resendDelaySeconds?: number;

  onSubmitAction?: (values: VerifyPhoneFormValues) => void | Promise<void>;

  onResendAction?: () => void | Promise<void>;
};
