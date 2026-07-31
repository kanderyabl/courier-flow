import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Text } from "@/components/Text";
import { AuthLayout } from "@/widgets/AuthLayout";

import { ChangePhoneForm } from "../ui";

function ChangePhoneFormExample() {
  const [submittedPhone, setSubmittedPhone] = useState<string>();

  return (
    <AuthLayout>
      <div
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        <ChangePhoneForm
          cancelHref="/en/verify-phone"
          onSubmitAction={async ({ phone }) => {
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, 1000);
            });

            setSubmittedPhone(phone);
          }}
        />

        {submittedPhone && (
          <Text variant="bodySmall" color="success">
            Submitted phone: {submittedPhone}
          </Text>
        )}
      </div>
    </AuthLayout>
  );
}

const meta = {
  title: "Features/Auth/ChangePhoneForm",
  component: ChangePhoneForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    autoFocus: false,
    cancelHref: "/en/verify-phone",
    onSubmitAction: async () => undefined,
  },
  argTypes: {
    autoFocus: {
      control: "boolean",
    },
    cancelHref: {
      control: "text",
    },
    onSubmitAction: {
      control: false,
    },
  },
} satisfies Meta<typeof ChangePhoneForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ChangePhoneFormExample />,
};

export const WithoutCancelLink: Story = {
  args: {
    cancelHref: undefined,
  },
  render: (args) => (
    <AuthLayout>
      <ChangePhoneForm {...args} />
    </AuthLayout>
  ),
};

export const WithSubmittingState: Story = {
  render: () => (
    <AuthLayout>
      <ChangePhoneForm
        cancelHref="/en/verify-phone"
        onSubmitAction={() =>
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 3000);
          })
        }
      />
    </AuthLayout>
  ),
};
