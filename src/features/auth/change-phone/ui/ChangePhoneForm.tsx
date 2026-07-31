"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";

import { createChangePhoneSchema } from "../model/changePhoneSchema";
import type { ChangePhoneFormProps, ChangePhoneFormValues } from "../types";

import styles from "./ChangePhoneForm.module.css";

export function ChangePhoneForm({
  autoFocus = true,
  cancelHref,
  onSubmitAction,
}: ChangePhoneFormProps) {
  const t = useTranslations("auth.changePhone");
  const validationT = useTranslations("auth.validation");

  const schema = useMemo(
    () =>
      createChangePhoneSchema({
        phoneRequired: validationT("phone.required"),
        phoneInvalid: validationT("phone.invalid"),
      }),
    [validationT],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePhoneFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      phone: "",
    },
  });

  const handleValidSubmit = async (values: ChangePhoneFormValues) => {
    await onSubmitAction?.(values);
  };

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

        <Text color="muted">{t("description")}</Text>
      </div>

      <TextInput
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        autoFocus={autoFocus}
        label={t("fields.phone.label")}
        placeholder={t("fields.phone.placeholder")}
        hint={t("fields.phone.hint")}
        error={errors.phone?.message}
        disabled={isSubmitting}
        {...register("phone")}
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
