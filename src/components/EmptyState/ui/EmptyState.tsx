import { clsx } from "clsx";

import { Text } from "@/components/Text";

import type { EmptyStateProps } from "../types";

import styles from "./EmptyState.module.css";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={clsx(styles.emptyState, className)} {...props}>
      {icon && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}

      <div className={styles.content}>
        <Text as="h3" variant="h3" className={styles.title}>
          {title}
        </Text>

        {description && (
          <Text color="muted" className={styles.description}>
            {description}
          </Text>
        )}
      </div>

      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
