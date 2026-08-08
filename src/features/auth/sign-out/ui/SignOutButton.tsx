"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";

import styles from "./SignOutButton.module.css";

export function SignOutButton() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.signOut");
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    setIsPending(true);
    setHasError(false);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("SIGN_OUT_FAILED");
      }

      router.replace(`/${locale}/sign-in`);
      router.refresh();
    } catch {
      setHasError(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles.root}>
      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        onClick={handleSignOut}
      >
        {isPending ? t("submitting") : t("submit")}
      </Button>

      {hasError ? (
        <p className={styles.error} role="alert">
          {t("error")}
        </p>
      ) : null}
    </div>
  );
}
