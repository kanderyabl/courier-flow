"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

import type { VerifyEmailCardProps } from "../types";

import styles from "./VerifyEmailCard.module.css";

export function VerifyEmailCard({
  variant = "pending",
  email,
  secondsLeft,
  isStatusLoading,
  isResending,
  isResent,
  hasResendError,
  onResendAction,
}: VerifyEmailCardProps) {
  const t = useTranslations("auth.verifyEmail");
  const resultT = useTranslations("auth.verifyEmailResult");
  const locale = useLocale();
  const isExpired = variant === "expired";
  const canResend = variant === "pending" || isExpired;

  const content =
    variant === "pending"
      ? {
          title: t("title"),
          description: email
            ? t("descriptionWithEmail", { email })
            : t("description"),
        }
      : {
          expired: {
            title: resultT("expired.title"),
            description: resultT("expired.description"),
          },
          success: {
            title: resultT("success.title"),
            description: resultT("success.description"),
          },
          invalid: {
            title: resultT("invalid.title"),
            description: resultT("invalid.description"),
          },
        }[variant];

  return (
    <div
      className={styles.wrapper}
      aria-live="polite"
      aria-busy={canResend && (isStatusLoading || isResending)}
    >
      <div className={styles.icon} aria-hidden="true">
        ✉️
      </div>

      <div className={styles.content}>
        <Text as="h1" variant="h2">
          {content.title}
        </Text>

        <Text color="muted">{content.description}</Text>
      </div>

      {canResend && isResent && (
        <Text color="success" variant="bodySmall">
          {t("resent")}
        </Text>
      )}

      {canResend && hasResendError && (
        <Text role="alert" variant="bodySmall" className={styles.resendError}>
          {t("resendFailed")}
        </Text>
      )}

      <div className={styles.actions}>
        {canResend ? (
          <>
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

            <Link
              href={`/${locale}/${isExpired ? "sign-in" : "change-email"}`}
              className={styles.secondaryLink}
            >
              {isExpired
                ? resultT("actions.signIn")
                : t("actions.changeEmail")}
            </Link>
          </>
        ) : (
          <Button as="link" href={`/${locale}/sign-in`} fullWidth>
            {resultT("actions.signIn")}
          </Button>
        )}
      </div>
    </div>
  );
}
