import type { z } from "zod";

import type { createResetPasswordSchema } from "../model/resetPasswordSchema";

export type ResetPasswordFormValues = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;

export type ResetPasswordSubmitValues = {
  token: string;
  password: string;
};

export type ResetPasswordFormProps = {
  token?: string;
  autoFocus?: boolean;

  onSubmitAction?: (values: ResetPasswordSubmitValues) => void | Promise<void>;
};
