import { clsx } from "clsx";

import type { SkeletonProps } from "../types";

import styles from "./Skeleton.module.css";

const toCssSize = (value?: number | string) => {
  if (typeof value === "number") {
    return `${value}px`;
  }

  return value;
};

export function Skeleton({
  variant = "text",
  width,
  height,
  radius,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(styles.skeleton, styles[variant], className)}
      style={{
        ...style,
        width: toCssSize(width),
        height: toCssSize(height),
        borderRadius: toCssSize(radius),
      }}
      {...props}
    />
  );
}
