import { clsx } from "clsx";

import type { DividerProps } from "../types";

import styles from "./Divider.module.css";

export function Divider({
  orientation = "horizontal",
  spacing = "md",
  className,
  role,
  ...props
}: DividerProps) {
  return (
    <div
      role={role ?? "separator"}
      aria-orientation={orientation}
      className={clsx(
        styles.divider,
        styles[orientation],
        styles[spacing],
        className,
      )}
      {...props}
    />
  );
}
