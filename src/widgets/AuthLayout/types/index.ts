import type { HTMLAttributes, ReactNode } from "react";

export type AuthLayoutProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};
