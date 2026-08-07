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
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const handleValidSubmit = async (values: ChangeEmailFormValues) => {
    clearErrors("email");
    clearErrors("root.server");

    try {
      await onSubmitAction(values);
    } catch (error) {
      const errorCode =
        error instanceof Error ? error.message : "CHANGE_EMAIL_FAILED";

      if (errorCode === "EMAIL_ALREADY_IN_USE") {
        setError(
          "email",
          {
            type: "server",
            message: t("errors.emailAlreadyInUse"),
          },
          {
            shouldFocus: true,
          },
        );

        return;
      }

      if (errorCode === "EMAIL_UNCHANGED") {
        setError(
          "email",
          {
            type: "server",
            message: t("errors.emailUnchanged"),
          },
          {
            shouldFocus: true,
          },
        );

        return;
      }

      const messageByCode: Record<string, string> = {
        UNAUTHORIZED: t("errors.unauthorized"),
        EMAIL_ALREADY_VERIFIED: t("errors.emailAlreadyVerified"),
        EMAIL_DELIVERY_FAILED: t("errors.deliveryFailed"),
        CHANGE_EMAIL_RATE_LIMITED: t("errors.rateLimited"),
        EMAIL_CHANGE_CONFLICT: t("errors.conflict"),
      };

      setError("root.server", {
        type: "server",
        message: messageByCode[errorCode] ?? t("errors.submitFailed"),
      });
    }
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
        id="change-email-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus={autoFocus}
        required
        readOnly={isSubmitting}
        label={t("fields.email.label")}
        placeholder={t("fields.email.placeholder")}
        hint={t("fields.email.hint")}
        error={errors.email?.message}
        {...register("email")}
      />

      {errors.root?.server?.message && (
        <Text role="alert" className={styles.submitError}>
          {errors.root.server.message}
        </Text>
      )}

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
