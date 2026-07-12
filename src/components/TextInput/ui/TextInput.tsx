import { forwardRef } from "react";
import { clsx } from "clsx";

import { Hint } from "@/components/Hint";
import { Text } from "@/components/Text";
import type { TextInputProps } from "../types";

import styles from "./TextInput.module.css";

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      id,
      label,
      hint,
      error,
      hideLabel,
      endIcon,
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
        {label && (
          <label
            htmlFor={id}
            className={clsx(styles.label, hideLabel && styles.hidden)}
          >
            <Text as="span" variant="label">
              {label}
              {required && (
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              )}
            </Text>
          </label>
        )}

        <div className={clsx(styles.input, error && styles.invalid)}>
          <input
            ref={ref}
            id={id}
            className={clsx(
              styles.control,
              endIcon && styles.withIcon,
              inputClassName,
            )}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />

          {endIcon && <span className={styles.icon}>{endIcon}</span>}
        </div>

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

TextInput.displayName = "TextInput";
