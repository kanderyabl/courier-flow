"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

import type { VerifyEmailCardProps } from "../types";

import styles from "./VerifyEmailCard.module.css";

export function VerifyEmailCard({
  email,
  secondsLeft,
  isStatusLoading,
  isResending,
  isResent,
  hasResendError,
  onResendAction,
}: VerifyEmailCardProps) {
  const t = useTranslations("auth.verifyEmail");
  const locale = useLocale();

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

      {hasResendError && (
        <Text role="alert" variant="bodySmall" className={styles.resendError}>
          {t("resendFailed")}
        </Text>
      )}

      <div className={styles.actions}>
        <Button
          type="button"
          fullWidth
          disabled={isStatusLoading || isResending || secondsLeft > 0}
          onClick={() => {
            void onResendAction();
          }}
        >
          {isStatusLoading
            ? t("actions.checking")
            : isResending
              ? t("actions.resending")
              : secondsLeft > 0
                ? t("actions.resendIn", {
                    seconds: secondsLeft,
                  })
                : t("actions.resend")}
        </Button>

        <Link href={`/${locale}/change-email`} className={styles.changeEmail}>
          {t("actions.changeEmail")}
        </Link>
      </div>
    </div>
  );
}
