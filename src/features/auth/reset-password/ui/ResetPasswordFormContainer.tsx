"use client";

import type { ResetPasswordSubmitValues } from "../types";

import { ResetPasswordForm } from "./ResetPasswordForm";

type ResetPasswordApiResponse = {
  code?: string;
};

type ResetPasswordFormContainerProps = {
  token?: string;
};

export function ResetPasswordFormContainer({
  token,
}: ResetPasswordFormContainerProps) {
  const handleSubmit = async (
    values: ResetPasswordSubmitValues,
  ): Promise<void> => {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(values),
    });

    const data = (await response
      .json()
      .catch(() => null)) as ResetPasswordApiResponse | null;

    if (!response.ok) {
      throw new Error(data?.code ?? "RESET_PASSWORD_FAILED");
    }
  };

  return (
    <ResetPasswordForm token={token} onSubmitAction={handleSubmit} />
  );
}
