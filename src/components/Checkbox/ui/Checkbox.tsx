import { forwardRef } from "react";
import { clsx } from "clsx";

import { Hint } from "@/components/Hint";
import { Text } from "@/components/Text";

import type { CheckboxProps } from "../types";

import styles from "./Checkbox.module.css";

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      label,
      hint,
      error,
      disabled,
      required,
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
        <label className={styles.label}>
          <input
            ref={ref}
            id={id}
            type="checkbox"
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={clsx(
              styles.checkbox,
              error && styles.invalid,
              inputClassName,
            )}
            {...props}
          />

          {label && (
            <Text as="span" variant="label" className={styles.labelText}>
              {label}

              {required && (
                <span className={styles.required} aria-hidden="true">
                  {" "}
                  *
                </span>
              )}
            </Text>
          )}
        </label>

        <div className={styles.message}>
          {error ? (
            <Hint id={errorId} variant="error">
              {error}
            </Hint>
          ) : (
            hint && <Hint id={hintId}>{hint}</Hint>
          )}
        </div>
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
