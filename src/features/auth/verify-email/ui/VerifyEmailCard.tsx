"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

import type { VerifyEmailCardProps } from "../types";

import styles from "./VerifyEmailCard.module.css";

export function VerifyEmailCard({
  email,
  onResendAction,
}: VerifyEmailCardProps) {
  const t = useTranslations("auth.verifyEmail");
  const locale = useLocale();

  const [isResending, setIsResending] = useState(false);
  const [isResent, setIsResent] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setIsResent(false);

    try {
      await onResendAction?.();
      setIsResent(true);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon} aria-hidden="true">
        ✉️
      </div>

      <div className={styles.content}>
        <Text as="h1" variant="h2">
          {t("title")}
        </Text>

        <Text color="muted">
          {email ? t("descriptionWithEmail", { email }) : t("description")}
        </Text>
      </div>

      {isResent && (
        <Text color="success" variant="bodySmall">
          {t("resent")}
        </Text>
      )}

      <div className={styles.actions}>
        <Button
          type="button"
          fullWidth
          disabled={isResending}
          onClick={handleResend}
        >
          {isResending ? t("actions.resending") : t("actions.resend")}
        </Button>

        <Link href={`/${locale}/sign-up`} className={styles.changeEmail}>
          {t("actions.changeEmail")}
        </Link>
      </div>
    </div>
  );
}
