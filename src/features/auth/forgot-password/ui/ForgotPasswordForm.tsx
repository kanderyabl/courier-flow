"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";

import { createForgotPasswordSchema } from "../model/forgotPasswordSchema";
import type {
  ForgotPasswordFormProps,
  ForgotPasswordFormValues,
} from "../types";

import styles from "./ForgotPasswordForm.module.css";

export function ForgotPasswordForm({
  autoFocus = true,
  onSubmitAction,
}: ForgotPasswordFormProps) {
  const t = useTranslations("auth.forgotPassword");
  const validationT = useTranslations("auth.validation");
  const locale = useLocale();

  const [isSubmitted, setIsSubmitted] = useState(false);

  const schema = useMemo(
    () =>
      createForgotPasswordSchema({
        emailRequired: validationT("email.required"),
        emailInvalid: validationT("email.invalid"),
      }),
    [validationT],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const handleValidSubmit = async (values: ForgotPasswordFormValues) => {
    if (!onSubmitAction) {
      return;
    }

    await onSubmitAction(values);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className={styles.success}>
        <div className={styles.icon} aria-hidden="true">
          ✉️
        </div>

        <div className={styles.header}>
          <Text as="h1" variant="h2">
            {t("success.title")}
          </Text>

          <Text color="muted">{t("success.description")}</Text>
        </div>

        <Button as="link" href={`/${locale}/sign-in`} fullWidth>
          {t("actions.backToSignIn")}
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

      <TextInput
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus={autoFocus}
        label={t("fields.email.label")}
        placeholder={t("fields.email.placeholder")}
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register("email")}
      />

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? t("actions.submitting") : t("actions.submit")}
      </Button>

      <Link href={`/${locale}/sign-in`} className={styles.backLink}>
        {t("actions.backToSignIn")}
      </Link>
    </form>
  );
}
