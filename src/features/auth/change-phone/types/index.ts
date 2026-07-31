import type { z } from "zod";

import type { createChangePhoneSchema } from "../model/changePhoneSchema";

export type ChangePhoneFormValues = z.infer<
  ReturnType<typeof createChangePhoneSchema>
>;

export type ChangePhoneFormProps = {
  autoFocus?: boolean;
  cancelHref?: string;

  onSubmitAction?: (values: ChangePhoneFormValues) => void | Promise<void>;
};
