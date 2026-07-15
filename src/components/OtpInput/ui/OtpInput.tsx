"use client";

import {
  forwardRef,
  useId,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { clsx } from "clsx";

import { Hint } from "@/components/Hint";
import { Text } from "@/components/Text";

import type { OtpInputProps } from "../types";

import styles from "./OtpInput.module.css";

export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(
  (
    {
      id,
      value,
      onValueChangeAction,
      onCompleteAction,
      length = 6,
      name,
      label,
      hint,
      error,
      disabled,
      required,
      autoFocus,
      digitAriaLabel = "Digit",
      className,
      inputClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const baseId = id ?? generatedId;

    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const hintId = hint ? `${baseId}-hint` : undefined;
    const errorId = error ? `${baseId}-error` : undefined;
    const labelId = label ? `${baseId}-label` : undefined;
    const describedBy = errorId ?? hintId;

    const normalizedValue = value.replace(/\D/g, "").slice(0, length);

    const digits = Array.from(
      { length },
      (_, index) => normalizedValue[index] ?? "",
    );

    const emitValue = (nextDigits: string[]) => {
      const nextValue = nextDigits.join("").slice(0, length);

      onValueChangeAction(nextValue);

      if (nextValue.length === length && nextDigits.every(Boolean)) {
        onCompleteAction?.(nextValue);
      }
    };

    const focusInput = (index: number) => {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    };

    const insertDigits = (startIndex: number, insertedValue: string) => {
      const insertedDigits = insertedValue
        .replace(/\D/g, "")
        .slice(0, length - startIndex);

      if (!insertedDigits) {
        return;
      }

      const nextDigits = [...digits];

      insertedDigits.split("").forEach((digit, offset) => {
        nextDigits[startIndex + offset] = digit;
      });

      emitValue(nextDigits);

      const nextIndex = Math.min(
        startIndex + insertedDigits.length,
        length - 1,
      );

      focusInput(nextIndex);
    };

    const handleChange = (
      index: number,
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const enteredValue = event.target.value;

      if (enteredValue.length > 1) {
        insertDigits(index, enteredValue);
        return;
      }

      const digit = enteredValue.replace(/\D/g, "").slice(-1);
      const nextDigits = [...digits];

      nextDigits[index] = digit;

      emitValue(nextDigits);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }
    };

    const handleKeyDown = (
      index: number,
      event: KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Backspace") {
        event.preventDefault();

        const nextDigits = [...digits];

        if (nextDigits[index]) {
          nextDigits[index] = "";
          emitValue(nextDigits);
          return;
        }

        if (index > 0) {
          nextDigits[index - 1] = "";
          emitValue(nextDigits);
          focusInput(index - 1);
        }

        return;
      }

      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        focusInput(index - 1);
      }

      if (event.key === "ArrowRight" && index < length - 1) {
        event.preventDefault();
        focusInput(index + 1);
      }
    };

    const handlePaste = (
      index: number,
      event: ClipboardEvent<HTMLInputElement>,
    ) => {
      event.preventDefault();

      insertDigits(index, event.clipboardData.getData("text"));
    };

    return (
      <div
        className={clsx(styles.wrapper, disabled && styles.disabled, className)}
        {...props}
      >
        {label && (
          <Text as="span" id={labelId} variant="label">
            {label}

            {required && (
              <span className={styles.required} aria-hidden="true">
                {" "}
                *
              </span>
            )}
          </Text>
        )}

        <div
          className={styles.inputs}
          role="group"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              id={`${baseId}-${index}`}
              type="text"
              value={digit}
              maxLength={length}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              autoFocus={autoFocus && index === 0}
              disabled={disabled}
              aria-label={`${digitAriaLabel} ${index + 1} / ${length}`}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              className={clsx(
                styles.input,
                error && styles.invalid,
                inputClassName,
              )}
              onChange={(event) => handleChange(index, event)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
            />
          ))}
        </div>

        <input
          ref={ref}
          type="hidden"
          name={name}
          value={normalizedValue}
          readOnly
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

OtpInput.displayName = "OtpInput";
