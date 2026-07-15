import type { DialogHTMLAttributes, ReactNode } from "react";

export type DialogSize = "sm" | "md" | "lg";

export type DialogProps = Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "onClose" | "onCancel" | "title"
> & {
  open: boolean;
  onCloseAction: () => void;

  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;

  size?: DialogSize;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
};
