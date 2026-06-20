import { clsx } from "clsx";

import { Hint } from "@/components/Hint";
import { Text } from "@/components/Text";

import type { SelectProps } from "../types";

import styles from "./Select.module.css";

export function Select({
  id,
  label,
  hint,
  error,
  hideLabel,
  options,
  placeholder,
  disabled,
  required,
  selectSize = "md",
  className,
  selectClassName,
  ...props
}: SelectProps) {
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

      <div className={clsx(styles.selectWrapper, error && styles.invalid)}>
        <select
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={clsx(styles.select, styles[selectSize], selectClassName)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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
}
