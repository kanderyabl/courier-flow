"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { Textarea } from "@/components/Textarea";
import { TextInput } from "@/components/TextInput";

import { createOrderSchema } from "../model/createOrderSchema";
import type {
  CreateOrderFormInput,
  CreateOrderFormProps,
  CreateOrderFormValues,
} from "../types";

import styles from "./CreateOrderForm.module.css";

export function CreateOrderForm({
  autoFocus = true,
  cancelHref,
  onSubmitAction,
}: CreateOrderFormProps) {
  const labels = useTranslations("order.labels");
  const t = useTranslations("order.create");

  const schema = useMemo(
    () =>
      createOrderSchema({
        pickupAddressRequired: t("validation.pickupAddressRequired"),
        pickupAddressTooLong: t("validation.pickupAddressTooLong"),
        deliveryAddressRequired: t("validation.deliveryAddressRequired"),
        deliveryAddressTooLong: t("validation.deliveryAddressTooLong"),
        recipientNameRequired: t("validation.recipientNameRequired"),
        recipientNameTooLong: t("validation.recipientNameTooLong"),
        recipientPhoneRequired: t("validation.recipientPhoneRequired"),
        recipientPhoneInvalid: t("validation.recipientPhoneInvalid"),
        commentTooLong: t("validation.commentTooLong"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderFormInput, unknown, CreateOrderFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      pickupAddress: "",
      deliveryAddress: "",
      recipientName: "",
      recipientPhone: "",
      comment: "",
    },
  });

  const handleValidSubmit = async (values: CreateOrderFormValues) => {
    clearErrors("root.server");

    try {
      await onSubmitAction(values);
    } catch {
      setError("root.server", {
        type: "server",
        message: t("errors.submitFailed"),
      });
    }
  };

  return (
    <Card padding="lg" className={styles.card}>
      <form
        className={styles.form}
        onSubmit={handleSubmit(handleValidSubmit)}
        aria-busy={isSubmitting}
        noValidate
      >
        <div className={styles.header}>
          <div className={styles.icon} aria-hidden="true">
            ↗
          </div>

          <div className={styles.heading}>
            <Text as="h1" variant="h2" className={styles.title}>
              {t("title")}
            </Text>
            <Text color="muted">{t("description")}</Text>
          </div>
        </div>

        <div className={styles.fields}>
          <TextInput
            id="create-order-pickup-address"
            autoComplete="street-address"
            autoFocus={autoFocus}
            required
            readOnly={isSubmitting}
            maxLength={500}
            label={labels("pickupAddress")}
            placeholder={t("fields.pickupAddress.placeholder")}
            error={errors.pickupAddress?.message}
            className={styles.wideField}
            {...register("pickupAddress")}
          />

          <TextInput
            id="create-order-delivery-address"
            autoComplete="off"
            required
            readOnly={isSubmitting}
            maxLength={500}
            label={labels("deliveryAddress")}
            placeholder={t("fields.deliveryAddress.placeholder")}
            error={errors.deliveryAddress?.message}
            className={styles.wideField}
            {...register("deliveryAddress")}
          />

          <TextInput
            id="create-order-recipient-name"
            autoComplete="name"
            required
            readOnly={isSubmitting}
            maxLength={80}
            label={labels("recipientName")}
            placeholder={t("fields.recipientName.placeholder")}
            error={errors.recipientName?.message}
            {...register("recipientName")}
          />

          <TextInput
            id="create-order-recipient-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            readOnly={isSubmitting}
            label={labels("recipientPhone")}
            placeholder={t("fields.recipientPhone.placeholder")}
            error={errors.recipientPhone?.message}
            {...register("recipientPhone")}
          />

          <Textarea
            id="create-order-comment"
            rows={4}
            readOnly={isSubmitting}
            maxLength={1000}
            label={labels("comment")}
            placeholder={t("fields.comment.placeholder")}
            error={errors.comment?.message}
            className={styles.wideField}
            {...register("comment")}
          />
        </div>

        {errors.root?.server?.message && (
          <Text role="alert" color="danger" className={styles.submitError}>
            {errors.root.server.message}
          </Text>
        )}

        <div className={styles.actions}>
          {cancelHref && (
            <Button
              as="link"
              href={cancelHref}
              variant="ghost"
              className={styles.action}
            >
              {t("actions.cancel")}
            </Button>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className={styles.action}
          >
            {isSubmitting ? t("actions.submitting") : t("actions.submit")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
