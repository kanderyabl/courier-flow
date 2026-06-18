import type { HTMLAttributes } from "react";

export type HintVariant = "default" | "error" | "success" | "warning";

export type HintProps = Omit<HTMLAttributes<HTMLParagraphElement>, "color"> & {
  variant?: HintVariant;
};
