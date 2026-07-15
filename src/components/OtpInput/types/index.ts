import type { HTMLAttributes } from "react";

export type OtpInputProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  value: string;
  onValueChangeAction: (value: string) => void;
  onCompleteAction?: (value: string) => void;

  length?: number;
  name?: string;

  label?: string;
  hint?: string;
  error?: string;

  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;

  digitAriaLabel?: string;
  inputClassName?: string;
};
