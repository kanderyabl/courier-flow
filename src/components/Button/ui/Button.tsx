import Link from "next/link";
import { clsx } from "clsx";

import styles from "./Button.module.css";
import type { ButtonProps } from "../types";

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    className,
    children,
  } = props;

  const classes = clsx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  );

  if (props.as === "link") {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { as, ...buttonProps } = props;

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
