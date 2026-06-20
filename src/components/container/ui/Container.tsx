import { clsx } from "clsx";

import type { ContainerProps } from "../types";

import styles from "./Container.module.css";

export function Container({
  size = "lg",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div className={clsx(styles.container, styles[size], className)} {...props}>
      {children}
    </div>
  );
}
