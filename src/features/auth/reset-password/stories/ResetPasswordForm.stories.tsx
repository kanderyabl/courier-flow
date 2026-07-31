import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AuthLayout } from "@/widgets/AuthLayout";

import { ResetPasswordForm } from "../ui";

const meta = {
  title: "Features/Auth/ResetPasswordForm",
  component: ResetPasswordForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    token: "storybook-reset-token",
    autoFocus: false,
    onSubmitAction: async () => undefined,
  },
  argTypes: {
    token: {
      control: "text",
    },
    autoFocus: {
      control: "boolean",
    },
    onSubmitAction: {
      control: false,
    },
  },
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AuthLayout>
      <ResetPasswordForm
        {...args}
        onSubmitAction={async () => {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 1000);
          });
        }}
      />
    </AuthLayout>
  ),
};

export const WithSubmittingState: Story = {
  render: () => (
    <AuthLayout>
      <ResetPasswordForm
        token="storybook-reset-token"
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

export const MissingToken: Story = {
  render: () => (
    <AuthLayout>
      <ResetPasswordForm autoFocus={false} />
    </AuthLayout>
  ),
};
