"use client";

import Link from "next/link";
import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { PasswordInput } from "@/components/PasswordInput";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";

import { createSignUpSchema } from "../model/signUpSchema";
import type { SignUpFormProps, SignUpFormValues } from "../types";

import styles from "./SignUpForm.module.css";

export function SignUpForm({ onSubmit }: SignUpFormProps) {
  const t = useTranslations("auth.signUp");
  const locale = useLocale();

  const schema = useMemo(
    () =>
      createSignUpSchema({
        nameRequired: t("validation.nameRequired"),
        nameTooShort: t("validation.nameTooShort"),
        nameTooLong: t("validation.nameTooLong"),

        emailRequired: t("validation.emailRequired"),
        emailInvalid: t("validation.emailInvalid"),

        phoneRequired: t("validation.phoneRequired"),
        phoneInvalid: t("validation.phoneInvalid"),

        passwordRequired: t("validation.passwordRequired"),
        passwordTooShort: t("validation.passwordTooShort"),
        passwordTooLong: t("validation.passwordTooLong"),
        passwordLowercase: t("validation.passwordLowercase"),
        passwordUppercase: t("validation.passwordUppercase"),
        passwordNumber: t("validation.passwordNumber"),
        passwordSpecial: t("validation.passwordSpecial"),

        confirmPasswordRequired: t("validation.confirmPasswordRequired"),
        passwordsDoNotMatch: t("validation.passwordsDoNotMatch"),

        termsRequired: t("validation.termsRequired"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(schema),

    mode: "onTouched",

    defaultValues: {
      role: "client",
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const handleValidSubmit = async (values: SignUpFormValues) => {
    await onSubmit?.(values);
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
          id="sign-up-name"
          type="text"
          label={t("fields.name.label")}
          placeholder={t("fields.name.placeholder")}
          autoComplete="name"
          autoCapitalize="words"
          required
          error={errors.name?.message}
          {...register("name")}
        />

        <TextInput
          id="sign-up-email"
          type="email"
          label={t("fields.email.label")}
          placeholder={t("fields.email.placeholder")}
          autoComplete="email"
          inputMode="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />

        <TextInput
          id="sign-up-phone"
          type="tel"
          label={t("fields.phone.label")}
          placeholder={t("fields.phone.placeholder")}
          autoComplete="tel"
          inputMode="tel"
          required
          error={errors.phone?.message}
          {...register("phone")}
        />

        <PasswordInput
          id="sign-up-password"
          label={t("fields.password.label")}
          placeholder={t("fields.password.placeholder")}
          hint={t("fields.password.hint")}
          autoComplete="new-password"
          showPasswordLabel={t("actions.showPassword")}
          hidePasswordLabel={t("actions.hidePassword")}
          required
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordInput
          id="sign-up-confirm-password"
          label={t("fields.confirmPassword.label")}
          placeholder={t("fields.confirmPassword.placeholder")}
          autoComplete="new-password"
          showPasswordLabel={t("actions.showPassword")}
          hidePasswordLabel={t("actions.hidePassword")}
          required
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Checkbox
          id="sign-up-terms"
          required
          error={errors.acceptTerms?.message}
          label={t.rich("fields.acceptTerms.label", {
            terms: (chunks) => <Link href={`/${locale}/terms`}>{chunks}</Link>,

            privacy: (chunks) => (
              <Link href={`/${locale}/privacy`}>{chunks}</Link>
            ),
          })}
          {...register("acceptTerms")}
        />
      </div>

      <div className={styles.footer}>
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("actions.submitting") : t("actions.submit")}
        </Button>

        <Text variant="bodySmall" color="muted" className={styles.signInText}>
          {t("alreadyHaveAccount")}{" "}
          <Link href={`/${locale}/sign-in`} className={styles.signInLink}>
            {t("actions.signIn")}
          </Link>
        </Text>
      </div>
    </form>
  );
}
