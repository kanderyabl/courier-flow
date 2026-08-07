import type { z } from "zod";

import type { createChangeEmailSchema } from "../model/changeEmailSchema";

export type ChangeEmailFormValues = z.infer<
  ReturnType<typeof createChangeEmailSchema>
>;

export type ChangeEmailFormProps = {
  autoFocus?: boolean;
  cancelHref?: string;

  onSubmitAction: (values: ChangeEmailFormValues) => Promise<void>;
};
