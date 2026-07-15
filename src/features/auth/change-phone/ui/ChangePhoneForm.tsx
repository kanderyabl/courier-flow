"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";

import { createChangePhoneSchema } from "../model/changePhoneSchema";
import type { ChangePhoneFormProps, ChangePhoneFormValues } from "../types";

import styles from "./ChangePhoneForm.module.css";

export function ChangePhoneForm({
  defaultPhone = "",
  autoFocus = false,
  onSubmitAction,
  onCancelAction,
}: ChangePhoneFormProps) {
  const t = useTranslations("auth.changePhone");

  const schema = useMemo(
    () =>
      createChangePhoneSchema({
        phoneRequired: t("validation.phoneRequired"),
        phoneInvalid: t("validation.phoneInvalid"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePhoneFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      phone: defaultPhone,
    },
  });

  useEffect(() => {
    reset({
      phone: defaultPhone,
    });
  }, [defaultPhone, reset]);

  const handleValidSubmit = async (values: ChangePhoneFormValues) => {
    await onSubmitAction(values);
  };

  const handleCancel = () => {
    reset({
      phone: defaultPhone,
    });

    onCancelAction?.();
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(handleValidSubmit)}
      noValidate
    >
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
        {onCancelAction && (
          <Button
            type="button"
            variant="ghost"
            className={styles.actionButton}
            disabled={isSubmitting}
            onClick={handleCancel}
          >
            {t("actions.cancel")}
          </Button>
        )}

        <Button
          type="submit"
          className={styles.actionButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("actions.submitting") : t("actions.submit")}
        </Button>
      </div>
    </form>
  );
}
