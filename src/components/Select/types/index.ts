import type { SelectHTMLAttributes } from "react";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type SelectSize = "sm" | "md";

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> & {
  label?: string;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
  options: SelectOption[];
  placeholder?: string;
  selectSize?: SelectSize;
  selectClassName?: string;
};
