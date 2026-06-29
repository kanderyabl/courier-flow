import type { HTMLAttributes } from "react";

export type SkeletonVariant = "text" | "rectangular" | "circular";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  radius?: number | string;
};
