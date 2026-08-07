import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { VerifyEmailCardProps } from "../types";

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
    variant: "pending",
    email: "vladyslav@example.com",
    secondsLeft: 0,
    isStatusLoading: false,
    isResending: false,
    isResent: false,
    hasResendError: false,
    onResendAction: async () => undefined,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["pending", "expired", "success", "invalid"],
    },
    email: {
      control: "text",
    },
    secondsLeft: {
      control: "number",
    },
    isStatusLoading: {
      control: "boolean",
    },
    isResending: {
      control: "boolean",
    },
    isResent: {
      control: "boolean",
    },
    hasResendError: {
      control: "boolean",
    },
    onResendAction: {
      control: false,
    },
  },
} satisfies Meta<typeof VerifyEmailCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithLayout = (args: VerifyEmailCardProps) => (
  <AuthLayout>
    <VerifyEmailCard {...args} />
  </AuthLayout>
);

export const Default: Story = {
  render: renderWithLayout,
};

export const WithoutEmail: Story = {
  args: {
    email: undefined,
  },
  render: renderWithLayout,
};

export const Expired: Story = {
  args: {
    variant: "expired",
    email: undefined,
  },
  render: renderWithLayout,
};

export const AlreadyVerified: Story = {
  args: {
    variant: "success",
    email: undefined,
  },
  render: renderWithLayout,
};

export const InvalidContext: Story = {
  args: {
    variant: "invalid",
    email: undefined,
  },
  render: renderWithLayout,
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

export const ResentState: Story = {
  args: {
    isResent: true,
  },
  render: renderWithLayout,
};

export const ErrorState: Story = {
  args: {
    hasResendError: true,
  },
  render: renderWithLayout,
};
