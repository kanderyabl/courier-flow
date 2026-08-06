"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import type { SignUpFormValues } from "../types";

import { SignUpForm } from "./SignUpForm";

type SignUpErrorResponse = {
  code?: string;
};

export function SignUpFormContainer() {
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (values: SignUpFormValues): Promise<void> => {
    const response = await fetch("/api/auth/sign-up", {
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
      .catch(() => null)) as SignUpErrorResponse | null;

    if (!response.ok) {
      throw new Error(data?.code ?? "SIGN_UP_FAILED");
    }

    router.push(`/${locale}/verify-email`);
    router.refresh();
  };

  return <SignUpForm onSubmitAction={handleSubmit} />;
}
