import type { TextColor } from "@/components/Text";
import type { HintVariant } from "../types";

export const HINT_COLOR_BY_VARIANT = {
  default: "muted",
  error: "danger",
  success: "success",
  warning: "warning",
} as const satisfies Record<HintVariant, TextColor>;
