import { clsx } from "clsx";

import type { CardProps } from "../types";

import styles from "./Card.module.css";

export function Card({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(styles.card, styles[variant], styles[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
