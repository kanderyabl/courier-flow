import type { InputHTMLAttributes, ReactNode } from "react";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
  endIcon?: ReactNode;
  className?: string;
  inputClassName?: string;
};
