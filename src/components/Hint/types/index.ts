import type { HTMLAttributes } from "react";

export type HintVariant = "default" | "error" | "success" | "warning";

export type HintProps = HTMLAttributes<HTMLParagraphElement> & {
  variant?: HintVariant;
};
