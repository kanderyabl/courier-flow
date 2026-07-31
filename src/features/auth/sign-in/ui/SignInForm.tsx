"use client";

import Link from "next/link";
import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { PasswordInput } from "@/components/PasswordInput";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";

import { createSignInSchema } from "../model/signInSchema";
import type { SignInFormProps, SignInFormValues } from "../types";

import styles from "./SignInForm.module.css";

export function SignInForm({
  autoFocus = true,
  onSubmitAction,
}: SignInFormProps) {
  const t = useTranslations("auth.signIn");
  const validationT = useTranslations("auth.validation");
  const locale = useLocale();

  const schema = useMemo(
    () =>
      createSignInSchema({
        emailRequired: validationT("email.required"),
        emailInvalid: validationT("email.invalid"),
        passwordRequired: validationT("password.required"),
      }),
    [validationT],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleValidSubmit = async (values: SignInFormValues) => {
    await onSubmitAction?.(values);
  };

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

        <div className={styles.passwordField}>
          <PasswordInput
            autoComplete="current-password"
            label={t("fields.password.label")}
            placeholder={t("fields.password.placeholder")}
            error={errors.password?.message}
            disabled={isSubmitting}
            {...register("password")}
          />

          <Link
            href={`/${locale}/forgot-password`}
            className={styles.forgotPassword}
          >
            {t("actions.forgotPassword")}
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? t("actions.submitting") : t("actions.submit")}
      </Button>

      <div className={styles.footer}>
        <Text variant="bodySmall" color="muted">
          {t("footer.noAccount")}
        </Text>

        <Link href={`/${locale}/sign-up`} className={styles.signUpLink}>
          {t("actions.signUp")}
        </Link>
      </div>
    </form>
  );
}
