import type { TextareaHTMLAttributes } from "react";

export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
  resize?: TextareaResize;
  inputClassName?: string;
};
