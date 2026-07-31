"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";

import { createChangeEmailSchema } from "../model/changeEmailSchema";
import type { ChangeEmailFormProps, ChangeEmailFormValues } from "../types";

import styles from "./ChangeEmailForm.module.css";

export function ChangeEmailForm({
  autoFocus = true,
  cancelHref,
  onSubmitAction,
}: ChangeEmailFormProps) {
  const t = useTranslations("auth.changeEmail");
  const validationT = useTranslations("auth.validation");

  const schema = useMemo(
    () =>
      createChangeEmailSchema({
        emailRequired: validationT("email.required"),
        emailInvalid: validationT("email.invalid"),
      }),
    [validationT],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const handleValidSubmit = async (values: ChangeEmailFormValues) => {
    await onSubmitAction?.(values);
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(handleValidSubmit)}
      noValidate
    >
      <div className={styles.icon} aria-hidden="true">
        ✉️
      </div>

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
        hint={t("fields.email.hint")}
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register("email")}
      />

      <div className={styles.actions}>
        {cancelHref && (
          <Button as="link" href={cancelHref} variant="ghost" fullWidth>
            {t("actions.cancel")}
          </Button>
        )}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("actions.submitting") : t("actions.submit")}
        </Button>
      </div>
    </form>
  );
}
