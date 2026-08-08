"use client";

import { useLocale } from "next-intl";

import type { ForgotPasswordFormValues } from "../types";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

type ForgotPasswordApiResponse = {
  code?: string;
};

export function ForgotPasswordFormContainer() {
  const locale = useLocale();

  const handleSubmit = async (
    values: ForgotPasswordFormValues,
  ): Promise<void> => {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        email: values.email,
        locale,
      }),
    });

    const data = (await response
      .json()
      .catch(() => null)) as ForgotPasswordApiResponse | null;

    if (!response.ok) {
      throw new Error(data?.code ?? "FORGOT_PASSWORD_FAILED");
    }
  };

  return <ForgotPasswordForm onSubmitAction={handleSubmit} />;
}
