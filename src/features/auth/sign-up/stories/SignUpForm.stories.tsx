import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card } from "@/components/Card";

import { SignUpForm } from "@/features/auth/sign-up";

const meta = {
  title: "Features/Auth/SignUpForm",
  component: SignUpForm,

  parameters: {
    layout: "centered",
  },

  tags: ["autodocs"],

  argTypes: {
    onSubmit: {
      control: false,
    },
  },
} satisfies Meta<typeof SignUpForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" style={{ width: "440px" }}>
      <SignUpForm />
    </Card>
  ),
};

export const WithSubmitDelay: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" style={{ width: "440px" }}>
      <SignUpForm
        onSubmit={() =>
          new Promise((resolve) => {
            window.setTimeout(resolve, 1500);
          })
        }
      />
    </Card>
  ),
};
