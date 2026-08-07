"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import type { ChangeEmailFormValues } from "../types";

import { ChangeEmailForm } from "./ChangeEmailForm";

type ChangeEmailFormContainerProps = {
  cancelHref?: string;
};

type ChangeEmailErrorResponse = {
  code?: string;
};

export function ChangeEmailFormContainer({
  cancelHref,
}: ChangeEmailFormContainerProps) {
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (
    values: ChangeEmailFormValues,
  ): Promise<void> => {
    const response = await fetch("/api/auth/change-email", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "same-origin",

      body: JSON.stringify({
        ...values,
        locale,
      }),
    });

    const data = (await response
      .json()
      .catch(() => null)) as ChangeEmailErrorResponse | null;

    if (!response.ok) {
      if (data?.code === "UNAUTHORIZED") {
        router.push(`/${locale}/sign-in`);
        router.refresh();
        return;
      }

      throw new Error(data?.code ?? "CHANGE_EMAIL_FAILED");
    }

    router.push(`/${locale}/verify-email`);
    router.refresh();
  };

  return (
    <ChangeEmailForm
      cancelHref={cancelHref}
      onSubmitAction={handleSubmit}
    />
  );
}
