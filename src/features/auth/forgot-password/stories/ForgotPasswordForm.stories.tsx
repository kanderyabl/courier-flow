import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AuthLayout } from "@/widgets/AuthLayout";

import { ForgotPasswordForm } from "../ui";

const meta = {
  title: "Features/Auth/ForgotPasswordForm",
  component: ForgotPasswordForm,
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
} satisfies Meta<typeof ForgotPasswordForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AuthLayout>
      <ForgotPasswordForm
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

export const EmptyForm: Story = {
  render: (args) => (
    <AuthLayout>
      <ForgotPasswordForm {...args} />
    </AuthLayout>
  ),
};

export const WithSubmittingState: Story = {
  render: () => (
    <AuthLayout>
      <ForgotPasswordForm
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
