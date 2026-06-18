import { clsx } from "clsx";

import styles from "./Text.module.css";

import { TextProps } from "../types";

export function Text({
  as: Component = "p",
  variant = "body",
  color = "default",
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Component
      className={clsx(styles.text, styles[variant], styles[color], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
