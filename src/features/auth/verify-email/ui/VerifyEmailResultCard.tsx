"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

import { verifyEmail } from "../api/verifyEmail";
import type {
  VerifyEmailResultCardProps,
  VerifyEmailViewStatus,
} from "../types";
import { VerifyEmailCardContainer } from "./VerifyEmailCardContainer";

import styles from "./VerifyEmailCard.module.css";

export function VerifyEmailResultCard({
  token,
  onVerifyAction,
}: VerifyEmailResultCardProps) {
  const t = useTranslations("auth.verifyEmailResult");
  const locale = useLocale();

  const [status, setStatus] = useState<VerifyEmailViewStatus>("loading");

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function runVerification() {
      setStatus("loading");

      try {
        const verifyAction = onVerifyAction ?? verifyEmail;

        const result = await verifyAction(token, controller.signal);

        setStatus(result);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Email verification request failed:", error);
        setStatus("error");
      }
    }

    void runVerification();

    return () => {
      controller.abort();
    };
  }, [token, attempt, onVerifyAction]);

  if (status === "expired") {
    return <VerifyEmailCardContainer variant="expired" token={token} />;
  }

  const content = {
    loading: {
      icon: "⏳",
      title: t("loading.title"),
      description: t("loading.description"),
    },

    success: {
      icon: "✅",
      title: t("success.title"),
      description: t("success.description"),
    },

    expired: {
      icon: "⌛",
      title: t("expired.title"),
      description: t("expired.description"),
    },

    invalid: {
      icon: "⚠️",
      title: t("invalid.title"),
      description: t("invalid.description"),
    },

    error: {
      icon: "❌",
      title: t("error.title"),
      description: t("error.description"),
    },
  } satisfies Record<
    VerifyEmailViewStatus,
    {
      icon: string;
      title: string;
      description: string;
    }
  >;

  const currentContent = content[status];

  return (
    <div
      className={styles.wrapper}
      aria-live="polite"
      aria-busy={status === "loading"}
    >
      <div className={styles.icon} aria-hidden="true">
        {currentContent.icon}
      </div>

      <div className={styles.content}>
        <Text as="h1" variant="h2">
          {currentContent.title}
        </Text>

        <Text color="muted">{currentContent.description}</Text>
      </div>

      {status === "error" && (
        <div className={styles.actions}>
          <Button
            type="button"
            fullWidth
            onClick={() => {
              setAttempt((currentAttempt) => currentAttempt + 1);
            }}
          >
            {t("actions.retry")}
          </Button>
        </div>
      )}

      {(status === "success" || status === "invalid") && (
        <div className={styles.actions}>
          <Button as="link" href={`/${locale}/sign-in`} fullWidth>
            {t("actions.signIn")}
          </Button>
        </div>
      )}
    </div>
  );
}
