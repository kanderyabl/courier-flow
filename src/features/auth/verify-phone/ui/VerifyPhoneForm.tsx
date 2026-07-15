"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { Text } from "@/components/Text";

import { createVerifyPhoneSchema } from "../model/verifyPhoneSchema";
import type { VerifyPhoneFormProps, VerifyPhoneFormValues } from "../types";

import { CODE_LENGTH, RESEND_DELAY_SECONDS } from "../constants";

import styles from "./VerifyPhoneForm.module.css";

export function VerifyPhoneForm({
  maskedPhone,
  codeLength = CODE_LENGTH,
  resendDelaySeconds = RESEND_DELAY_SECONDS,
  onSubmitAction,
  onResendAction,
}: VerifyPhoneFormProps) {
  const t = useTranslations("auth.verifyPhone");
  const locale = useLocale();

  const [secondsLeft, setSecondsLeft] = useState(resendDelaySeconds);
  const [isResending, setIsResending] = useState(false);
  const [isResent, setIsResent] = useState(false);

  const schema = useMemo(
    () =>
      createVerifyPhoneSchema(
        {
          codeRequired: t("validation.codeRequired"),
          codeLength: t("validation.codeLength", {
            length: codeLength,
          }),
          codeDigitsOnly: t("validation.codeDigitsOnly"),
        },
        codeLength,
      ),
    [codeLength, t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyPhoneFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [secondsLeft]);

  const handleValidSubmit = async (values: VerifyPhoneFormValues) => {
    await onSubmitAction?.(values);
  };

  const handleResend = async () => {
    if (isResending || secondsLeft > 0) {
      return;
    }

    setIsResending(true);
    setIsResent(false);

    try {
      await onResendAction?.();

      setIsResent(true);
      setSecondsLeft(resendDelaySeconds);
    } finally {
      setIsResending(false);
    }
  };

  const resendButtonText = (() => {
    if (isResending) {
      return t("actions.resending");
    }

    if (secondsLeft > 0) {
      return t("actions.resendIn", {
        seconds: secondsLeft,
      });
    }

    return t("actions.resend");
  })();

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(handleValidSubmit)}
      noValidate
    >
      <div className={styles.icon} aria-hidden="true">
        📱
      </div>

      <div className={styles.header}>
        <Text as="h1" variant="h2">
          {t("title")}
        </Text>

        <Text color="muted">
          {maskedPhone
            ? t("descriptionWithPhone", {
                phone: maskedPhone,
                length: codeLength,
              })
            : t("description", {
                length: codeLength,
              })}
        </Text>
      </div>

      <Controller
        name="code"
        control={control}
        render={({ field }) => (
          <OtpInput
            ref={field.ref}
            id="phone-verification-code"
            name={field.name}
            value={field.value}
            length={codeLength}
            label={t("fields.code.label")}
            hint={t("fields.code.hint")}
            error={errors.code?.message}
            digitAriaLabel={t("fields.code.digitAriaLabel")}
            required
            autoFocus
            onBlur={field.onBlur}
            onValueChangeAction={field.onChange}
          />
        )}
      />

      <div className={styles.actions}>
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("actions.submitting") : t("actions.submit")}
        </Button>

        <Button
          type="button"
          variant="ghost"
          fullWidth
          disabled={isResending || secondsLeft > 0}
          onClick={handleResend}
        >
          {resendButtonText}
        </Button>
      </div>

      <div className={styles.message} aria-live="polite">
        {isResent && (
          <Text variant="bodySmall" color="success">
            {t("resent")}
          </Text>
        )}
      </div>

      <Link href={`/${locale}/sign-up`} className={styles.changePhone}>
        {t("actions.changePhone")}
      </Link>
    </form>
  );
}
