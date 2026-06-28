import { forwardRef } from "react";
import { clsx } from "clsx";

import { Hint } from "@/components/Hint";
import { Text } from "@/components/Text";

import type { TextareaProps } from "../types";

import styles from "./Textarea.module.css";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      hint,
      error,
      hideLabel,
      disabled,
      required,
      resize = "vertical",
      className,
      inputClassName,
      ...props
    },
    ref,
  ) => {
    const hintId = id && hint ? `${id}-hint` : undefined;
    const errorId = id && error ? `${id}-error` : undefined;
    const describedBy = errorId ?? hintId;

    return (
      <div
        className={clsx(styles.wrapper, disabled && styles.disabled, className)}
      >
        {label && (
          <label
            htmlFor={id}
            className={clsx(styles.label, hideLabel && styles.hidden)}
          >
            <Text as="span" variant="label">
              {label}
              {required && (
                <span className={styles.required} aria-hidden="true">
                  {" "}
                  *
                </span>
              )}
            </Text>
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={clsx(
            styles.textarea,
            styles[resize],
            error && styles.invalid,
            inputClassName,
          )}
          {...props}
        />

        {error ? (
          <Hint id={errorId} variant="error">
            {error}
          </Hint>
        ) : (
          hint && <Hint id={hintId}>{hint}</Hint>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
