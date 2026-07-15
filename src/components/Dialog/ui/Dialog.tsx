"use client";

import { useEffect, useId, useRef, type MouseEvent } from "react";
import { clsx } from "clsx";

import { Text } from "@/components/Text";

import type { DialogProps } from "../types";

import styles from "./Dialog.module.css";

export function Dialog({
  open,
  onCloseAction,
  title,
  description,
  children,
  footer,
  size = "md",
  closeLabel = "Close dialog",
  closeOnBackdrop = true,
  className,
  onClick,
  ...props
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const generatedId = useId();

  const titleId = `${generatedId}-title`;
  const descriptionId = description ? `${generatedId}-description` : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || !closeOnBackdrop) {
      return;
    }

    const clickedOnBackdrop = event.target === event.currentTarget;

    if (clickedOnBackdrop) {
      onCloseAction();
    }
  };

  return (
    <dialog
      {...props}
      ref={dialogRef}
      className={clsx(styles.dialog, styles[size], className)}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault();
        onCloseAction();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <Text id={titleId} as="h2" variant="h3">
              {title}
            </Text>

            {description && (
              <Text id={descriptionId} color="muted" variant="bodySmall">
                {description}
              </Text>
            )}
          </div>

          <button
            type="button"
            className={styles.closeButton}
            aria-label={closeLabel}
            onClick={onCloseAction}
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </dialog>
  );
}
