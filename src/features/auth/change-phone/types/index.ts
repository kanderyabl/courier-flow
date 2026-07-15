import type { PhoneValidationMessages } from "../../model";

import type { z } from "zod";

import type { createChangePhoneSchema } from "../model/changePhoneSchema";

export type ChangePhoneValidationMessages = PhoneValidationMessages & {
  phoneUnchanged: string;
};

export type ChangePhoneFormValues = z.infer<
  ReturnType<typeof createChangePhoneSchema>
>;

export type ChangePhoneFormProps = {
  defaultPhone?: string;
  autoFocus?: boolean;

  onSubmitAction: (values: ChangePhoneFormValues) => void | Promise<void>;

  onCancelAction?: () => void;
};
