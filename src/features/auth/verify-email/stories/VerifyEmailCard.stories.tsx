import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AuthLayout } from "@/widgets/AuthLayout";

import { VerifyEmailCard } from "../ui";

const meta = {
  title: "Features/Auth/VerifyEmailCard",
  component: VerifyEmailCard,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    email: "vladyslav@example.com",
  },
  argTypes: {
    email: {
      control: "text",
    },
    onResendAction: {
      control: false,
    },
  },
} satisfies Meta<typeof VerifyEmailCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AuthLayout>
      <VerifyEmailCard {...args} />
    </AuthLayout>
  ),
};

export const WithoutEmail: Story = {
  args: {
    email: undefined,
  },
  render: (args) => (
    <AuthLayout>
      <VerifyEmailCard {...args} />
    </AuthLayout>
  ),
};

export const WithResendDelay: Story = {
  render: (args) => (
    <AuthLayout>
      <VerifyEmailCard
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
