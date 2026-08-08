import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

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

export const ExpiredToken: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("RESET_TOKEN_EXPIRED");
    },
  },
  render: (args) => (
    <AuthLayout>
      <ResetPasswordForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText("New password"),
      "NewPassword1!",
    );
    await userEvent.type(
      canvas.getByLabelText("Confirm new password"),
      "NewPassword1!",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Reset password" }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "This reset link has expired. Request a new one.",
    );
  },
};

export const InvalidToken: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("RESET_TOKEN_INVALID");
    },
  },
  render: (args) => (
    <AuthLayout>
      <ResetPasswordForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText("New password"),
      "NewPassword1!",
    );
    await userEvent.type(
      canvas.getByLabelText("Confirm new password"),
      "NewPassword1!",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Reset password" }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "This reset link is invalid or has already been used.",
    );
  },
};
