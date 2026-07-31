import type { z } from "zod";

import type { createForgotPasswordSchema } from "../model/forgotPasswordSchema";

export type ForgotPasswordFormValues = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;

export type ForgotPasswordFormProps = {
  autoFocus?: boolean;

  onSubmitAction?: (values: ForgotPasswordFormValues) => void | Promise<void>;
};
