import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Text } from "@/components/Text";

import { ChangePhoneForm } from "../ui";

function ChangePhoneFormExample() {
  const [submittedPhone, setSubmittedPhone] = useState<string>();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "440px",
        display: "grid",
        gap: "20px",
      }}
    >
      <ChangePhoneForm
        defaultPhone="+48 "
        autoFocus
        onSubmitAction={async ({ phone }) => {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 1000);
          });

          setSubmittedPhone(phone);
        }}
        onCancelAction={() => {
          setSubmittedPhone(undefined);
        }}
      />

      {submittedPhone && (
        <Text variant="bodySmall" color="success">
          Submitted phone: {submittedPhone}
        </Text>
      )}
    </div>
  );
}

const meta = {
  title: "Features/Auth/ChangePhoneForm",
  component: ChangePhoneForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    defaultPhone: "+48 ",
    autoFocus: false,
    onSubmitAction: async () => undefined,
  },
  argTypes: {
    defaultPhone: {
      control: "text",
    },

    autoFocus: {
      control: "boolean",
    },
    onSubmitAction: {
      control: false,
    },
    onCancelAction: {
      control: false,
    },
  },
} satisfies Meta<typeof ChangePhoneForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ChangePhoneFormExample />,
};

export const WithoutCancelButton: Story = {
  render: () => (
    <div
      style={{
        width: "100%",
        maxWidth: "440px",
      }}
    >
      <ChangePhoneForm
        onSubmitAction={async ({ phone }) => {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 1000);
          });

          console.log(phone);
        }}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div
      style={{
        width: "100%",
        maxWidth: "440px",
      }}
    >
      <ChangePhoneForm
        autoFocus
        onSubmitAction={async () => undefined}
        onCancelAction={() => undefined}
      />
    </div>
  ),
};
