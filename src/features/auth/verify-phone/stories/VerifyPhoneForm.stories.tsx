import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AuthLayout } from "@/widgets/AuthLayout";

import { VerifyPhoneForm } from "../ui";

const meta = {
  title: "Features/Auth/VerifyPhoneForm",
  component: VerifyPhoneForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    maskedPhone: "+48 *** *** 789",
    codeLength: 6,
    resendDelaySeconds: 10,
  },
  argTypes: {
    maskedPhone: {
      control: "text",
    },
    codeLength: {
      control: {
        type: "number",
        min: 4,
        max: 8,
      },
    },
    resendDelaySeconds: {
      control: "number",
    },
    onSubmitAction: {
      control: false,
    },
    onResendAction: {
      control: false,
    },
  },
} satisfies Meta<typeof VerifyPhoneForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AuthLayout>
      <VerifyPhoneForm {...args} />
    </AuthLayout>
  ),
};

export const WithoutPhone: Story = {
  args: {
    maskedPhone: undefined,
  },
  render: (args) => (
    <AuthLayout>
      <VerifyPhoneForm {...args} />
    </AuthLayout>
  ),
};

export const WithSubmitDelay: Story = {
  render: (args) => (
    <AuthLayout>
      <VerifyPhoneForm
        {...args}
        onSubmitAction={() =>
          new Promise((resolve) => {
            window.setTimeout(resolve, 1500);
          })
        }
      />
    </AuthLayout>
  ),
};

export const WithResendDelay: Story = {
  render: (args) => (
    <AuthLayout>
      <VerifyPhoneForm
        {...args}
        onResendAction={() =>
          new Promise((resolve) => {
            window.setTimeout(resolve, 1500);
          })
        }
      />
    </AuthLayout>
  ),
};
