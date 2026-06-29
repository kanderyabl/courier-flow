import type { HTMLAttributes } from "react";

export type AvatarSize = "sm" | "md" | "lg";
export type AvatarShape = "circle" | "square";

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
};
