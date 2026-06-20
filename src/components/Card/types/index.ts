import type { HTMLAttributes } from "react";

export type CardVariant = "default" | "outlined" | "elevated";
export type CardPadding = "sm" | "md" | "lg";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};
