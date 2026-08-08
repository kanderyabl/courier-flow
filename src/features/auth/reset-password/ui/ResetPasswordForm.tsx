"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { PasswordInput } from "@/components/PasswordInput";
import { Text } from "@/components/Text";

import { createResetPasswordSchema } from "../model/resetPasswordSchema";
import type { ResetPasswordFormProps, ResetPasswordFormValues } from "../types";

import styles from "./ResetPasswordForm.module.css";

export function ResetPasswordForm({
  token,
  autoFocus = true,
  onSubmitAction,
}: ResetPasswordFormProps) {
  const t = useTranslations("auth.resetPassword");
  const validationT = useTranslations("auth.validation");
  const locale = useLocale();

  const [isCompleted, setIsCompleted] = useState(false);

  const schema = useMemo(
    () =>
      createResetPasswordSchema({
        passwordRequired: validationT("password.required"),
        passwordTooShort: validationT("password.tooShort"),
        passwordTooLong: validationT("password.tooLong"),
        passwordLowercase: validationT("password.lowercase"),
        passwordUppercase: validationT("password.uppercase"),
        passwordNumber: validationT("password.number"),
        passwordSpecial: validationT("password.special"),
        confirmPasswordRequired: validationT("confirmPassword.required"),
        passwordsDoNotMatch: validationT("confirmPassword.doNotMatch"),
      }),
    [validationT],
  );

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleValidSubmit = async (values: ResetPasswordFormValues) => {
    if (!token || !onSubmitAction) {
      return;
    }

    clearErrors("root.server");

    try {
      await onSubmitAction({
        token,
        password: values.password,
      });

      setIsCompleted(true);
    } catch (error) {
      const errorCode =
        error instanceof Error ? error.message : "RESET_PASSWORD_FAILED";

      const messageByCode: Record<string, string> = {
        RESET_TOKEN_INVALID: t("errors.invalidToken"),
        RESET_TOKEN_EXPIRED: t("errors.expiredToken"),
        RESET_PASSWORD_RATE_LIMITED: t("errors.rateLimited"),
      };

      setError("root.server", {
        type: "server",
        message: messageByCode[errorCode] ?? t("errors.submitFailed"),
      });
    }
  };

  if (!token) {
    return (
      <div className={styles.state}>
        <div className={styles.icon} aria-hidden="true">
          🔗
        </div>

        <div className={styles.header}>
          <Text as="h1" variant="h2">
            {t("invalid.title")}
          </Text>

          <Text color="muted">{t("invalid.description")}</Text>
        </div>

        <Button as="link" href={`/${locale}/forgot-password`} fullWidth>
          {t("actions.requestNewLink")}
        </Button>

        <Link href={`/${locale}/sign-in`} className={styles.backLink}>
          {t("actions.backToSignIn")}
        </Link>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className={styles.state}>
        <div className={styles.icon} aria-hidden="true">
          ✓
        </div>

        <div className={styles.header}>
          <Text as="h1" variant="h2">
            {t("success.title")}
          </Text>

          <Text color="muted">{t("success.description")}</Text>
        </div>

        <Button as="link" href={`/${locale}/sign-in`} fullWidth>
          {t("actions.signIn")}
        </Button>
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(handleValidSubmit)}
      noValidate
    >
      <div className={styles.header}>
        <Text as="h1" variant="h2">
          {t("title")}
        </Text>

        <Text color="muted">{t("description")}</Text>
      </div>

      <div className={styles.fields}>
        <PasswordInput
          id="reset-password-password"
          autoComplete="new-password"
          autoFocus={autoFocus}
          label={t("fields.password.label")}
          placeholder={t("fields.password.placeholder")}
          hint={t("fields.password.hint")}
          error={errors.password?.message}
          disabled={isSubmitting}
          required
          {...register("password")}
        />

        <PasswordInput
          id="reset-password-confirm-password"
          autoComplete="new-password"
          label={t("fields.confirmPassword.label")}
          placeholder={t("fields.confirmPassword.placeholder")}
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
          required
          {...register("confirmPassword")}
        />
      </div>

      {errors.root?.server?.message ? (
        <Text role="alert" className={styles.submitError}>
          {errors.root.server.message}
        </Text>
      ) : null}

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? t("actions.submitting") : t("actions.submit")}
      </Button>

      <Link href={`/${locale}/sign-in`} className={styles.backLink}>
        {t("actions.backToSignIn")}
      </Link>
    </form>
  );
}
