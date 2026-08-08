"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import type { SignInFormValues } from "../types";

import { SignInForm } from "./SignInForm";

type SignInApiResponse = {
  code?: string;
  next?: "HOME" | "VERIFY_EMAIL";
};

export function SignInFormContainer() {
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (values: SignInFormValues): Promise<void> => {
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "same-origin",
      body: JSON.stringify(values),
    });

    const data = (await response
      .json()
      .catch(() => null)) as SignInApiResponse | null;

    if (!response.ok) {
      throw new Error(data?.code ?? "SIGN_IN_FAILED");
    }

    if (data?.next === "VERIFY_EMAIL") {
      router.replace(`/${locale}/verify-email`);
      router.refresh();
      return;
    }

    if (data?.next !== "HOME") {
      throw new Error("SIGN_IN_FAILED");
    }

    router.replace(`/${locale}`);
    router.refresh();
  };

  return <SignInForm onSubmitAction={handleSubmit} />;
}
