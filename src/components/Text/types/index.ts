import type { HTMLAttributes, ReactNode } from "react";

export type TextTag = "p" | "span" | "h1" | "h2" | "h3" | "label";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodySmall"
  | "caption"
  | "label"
  | "button";

export type TextColor =
  | "default"
  | "muted"
  | "primary"
  | "success"
  | "warning"
  | "danger";

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: TextTag;
  variant?: TextVariant;
  color?: TextColor;
  children: ReactNode;
};
