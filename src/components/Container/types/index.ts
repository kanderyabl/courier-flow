import type { HTMLAttributes } from "react";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: ContainerSize;
};
