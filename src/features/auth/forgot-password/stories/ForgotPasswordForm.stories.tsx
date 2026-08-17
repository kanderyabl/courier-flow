import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { AuthLayout } from "@/widgets/AuthLayout";

import { ForgotPasswordForm } from "../ui";

const EMAIL_LABEL = /^Email address\s*\*?$/;

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

export const RateLimited: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("FORGOT_PASSWORD_RATE_LIMITED");
    },
  },
  render: (args) => (
    <AuthLayout>
      <ForgotPasswordForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(EMAIL_LABEL),
      "user@example.com",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Send reset link" }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Too many reset requests. Please wait and try again.",
    );
  },
};

export const UnknownFailure: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("UNEXPECTED_ERROR");
    },
  },
  render: (args) => (
    <AuthLayout>
      <ForgotPasswordForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(EMAIL_LABEL),
      "user@example.com",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Send reset link" }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Could not request a password reset. Please try again.",
    );
  },
};
