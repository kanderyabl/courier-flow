import type { TextInputProps } from "@/components/TextInput";

export type PasswordInputProps = Omit<TextInputProps, "type" | "endIcon"> & {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};
