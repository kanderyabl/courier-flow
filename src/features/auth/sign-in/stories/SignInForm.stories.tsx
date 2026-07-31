import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Text } from "@/components/Text";
import { AuthLayout } from "@/widgets/AuthLayout";

import { SignInForm } from "../ui";

function SignInFormExample() {
  const [submittedEmail, setSubmittedEmail] = useState<string>();

  return (
    <AuthLayout>
      <div
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        <SignInForm
          autoFocus={false}
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
  title: "Features/Auth/SignInForm",
  component: SignInForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    autoFocus: false,
    onSubmitAction: async () => undefined,
  },
  argTypes: {
    autoFocus: {
      control: "boolean",
    },
    onSubmitAction: {
      control: false,
    },
  },
} satisfies Meta<typeof SignInForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <SignInFormExample />,
};

export const EmptyForm: Story = {
  render: (args) => (
    <AuthLayout>
      <SignInForm {...args} />
    </AuthLayout>
  ),
};

export const WithSubmittingState: Story = {
  render: () => (
    <AuthLayout>
      <SignInForm
        autoFocus={false}
        onSubmitAction={() =>
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 3000);
          })
        }
      />
    </AuthLayout>
  ),
};
