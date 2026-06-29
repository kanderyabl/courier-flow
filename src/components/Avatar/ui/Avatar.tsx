import { clsx } from "clsx";

import { getInitials } from "../lib/getInitials";
import type { AvatarProps } from "../types";

import styles from "./Avatar.module.css";

export function Avatar({
  src,
  name,
  size = "md",
  shape = "circle",
  className,
  style,
  ...props
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div
      role={src ? "img" : undefined}
      aria-label={src ? name : undefined}
      className={clsx(styles.avatar, styles[size], styles[shape], className)}
      style={{
        ...style,
        backgroundImage: src ? `url(${src})` : undefined,
      }}
      {...props}
    >
      {!src && initials}
    </div>
  );
}
