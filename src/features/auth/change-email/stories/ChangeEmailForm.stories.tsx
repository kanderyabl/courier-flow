import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Text } from "@/components/Text";
import { AuthLayout } from "@/widgets/AuthLayout";

import { ChangeEmailForm } from "../ui";

function ChangeEmailFormExample() {
  const [submittedEmail, setSubmittedEmail] = useState<string>();

  return (
    <AuthLayout>
      <div
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        <ChangeEmailForm
          cancelHref="/en/verify-email"
          onSubmitAction={async ({ email }) => {
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, 1000);
            });

            setSubmittedEmail(email);
          }}
        />

        {submittedEmail && (
          <Text variant="bodySmall" color="success">
            Submitted email: {submittedEmail}
          </Text>
        )}
      </div>
    </AuthLayout>
  );
}

const meta = {
  title: "Features/Auth/ChangeEmailForm",
  component: ChangeEmailForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    autoFocus: false,
    cancelHref: "/en/verify-email",
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
} satisfies Meta<typeof ChangeEmailForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ChangeEmailFormExample />,
};

export const WithoutCancelLink: Story = {
  args: {
    cancelHref: undefined,
  },
  render: (args) => (
    <AuthLayout>
      <ChangeEmailForm {...args} />
    </AuthLayout>
  ),
};

export const WithSubmittingState: Story = {
  render: () => (
    <AuthLayout>
      <ChangeEmailForm
        cancelHref="/en/verify-email"
        onSubmitAction={() =>
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 3000);
          })
        }
      />
    </AuthLayout>
  ),
};
