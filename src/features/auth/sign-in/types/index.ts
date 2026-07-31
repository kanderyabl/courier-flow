import type { z } from "zod";

import type { createSignInSchema } from "../model/signInSchema";

export type SignInFormValues = z.infer<ReturnType<typeof createSignInSchema>>;

export type SignInFormProps = {
  autoFocus?: boolean;

  onSubmitAction?: (values: SignInFormValues) => void | Promise<void>;
};
