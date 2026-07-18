"use client";

import { useTranslations } from "next-intl";

import { Dialog } from "@/components/Dialog";

import type { ChangePhoneFormValues, ChangePhoneModalProps } from "../types";

import { ChangePhoneForm } from "./ChangePhoneForm";

export function ChangePhoneModal({
  open,
  onCloseAction,
  onSubmitAction,
}: ChangePhoneModalProps) {
  const t = useTranslations("auth.changePhone");

  const handleSubmit = async (values: ChangePhoneFormValues) => {
    await onSubmitAction(values);

    onCloseAction();
  };

  return (
    <Dialog
      open={open}
      size="sm"
      title={t("title")}
      description={t("description")}
      closeLabel={t("actions.close")}
      onCloseAction={onCloseAction}
    >
      <ChangePhoneForm
        autoFocus
        onSubmitAction={handleSubmit}
        onCancelAction={onCloseAction}
      />
    </Dialog>
  );
}
