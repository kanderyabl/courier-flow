import type { HTMLAttributes } from "react";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerSpacing = "none" | "sm" | "md" | "lg";

export type DividerProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: DividerOrientation;
  spacing?: DividerSpacing;
};
