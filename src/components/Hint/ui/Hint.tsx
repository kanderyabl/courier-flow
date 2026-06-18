import { clsx } from "clsx";

import styles from "./Hint.module.css";

import type { HintProps } from "../types";

import { Text } from "@/components/Text";
import { HINT_COLOR_BY_VARIANT } from "../constants";

export function Hint({
  variant = "default",
  className,
  children,
  ...props
}: HintProps) {
  if (!children) {
    return null;
  }

  const color = HINT_COLOR_BY_VARIANT[variant];
  const role = props.role ?? (variant === "error" ? "alert" : undefined);

  return (
    <Text
      as="p"
      variant="caption"
      color={color}
      {...props}
      role={role}
      className={clsx(styles.hint, styles[variant], className)}
    >
      {children}
    </Text>
  );
}
