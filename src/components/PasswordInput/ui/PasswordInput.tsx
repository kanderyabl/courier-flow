"use client";

import { forwardRef, useState } from "react";

import { TextInput } from "@/components/TextInput";

import type { PasswordInputProps } from "../types";

import styles from "./PasswordInput.module.css";

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showPasswordLabel = "Show password",
      hidePasswordLabel = "Hide password",
      autoComplete = "current-password",
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const accessibilityLabel = isPasswordVisible
      ? hidePasswordLabel
      : showPasswordLabel;

    return (
      <TextInput
        {...props}
        ref={ref}
        type={isPasswordVisible ? "text" : "password"}
        autoComplete={autoComplete}
        endIcon={
          <button
            type="button"
            className={styles.toggle}
            aria-label={accessibilityLabel}
            aria-pressed={isPasswordVisible}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m3 3 18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.7 3.3M6.2 7.3C3.8 9.1 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3-.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
