import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Text } from "@/components/Text";
import { AuthLayout } from "@/widgets/AuthLayout";

import { ChangeEmailForm } from "../ui";

const NEW_EMAIL_LABEL = /^New email address\s*\*?$/;

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
  render: (args) => (
    <AuthLayout>
      <ChangeEmailForm
        {...args}
        onSubmitAction={() => new Promise<void>(() => undefined)}
      />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(NEW_EMAIL_LABEL),
      "new@example.com",
    );
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Save and send verification email",
      }),
    );

    await expect(
      canvas.getByRole("button", {
        name: "Saving...",
      }),
    ).toBeDisabled();
  },
};

export const EmailAlreadyInUse: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("EMAIL_ALREADY_IN_USE");
    },
  },
  render: (args) => (
    <AuthLayout>
      <ChangeEmailForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = canvas.getByLabelText(NEW_EMAIL_LABEL);

    await userEvent.type(
      emailInput,
      "taken@example.com",
    );
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Save and send verification email",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "An account with this email already exists.",
    );
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(emailInput).toHaveFocus();
  },
};

export const DeliveryFailure: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("EMAIL_DELIVERY_FAILED");
    },
  },
  render: (args) => (
    <AuthLayout>
      <ChangeEmailForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(NEW_EMAIL_LABEL),
      "new@example.com",
    );
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Save and send verification email",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Could not send the verification email. Please try again.",
    );
  },
};

export const EmailUnchanged: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("EMAIL_UNCHANGED");
    },
  },
  render: (args) => (
    <AuthLayout>
      <ChangeEmailForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = canvas.getByLabelText(NEW_EMAIL_LABEL);

    await userEvent.type(emailInput, "current@example.com");
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Save and send verification email",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Enter an email address different from your current one.",
    );
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(emailInput).toHaveFocus();
  },
};

export const Unauthorized: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("UNAUTHORIZED");
    },
  },
  render: (args) => (
    <AuthLayout>
      <ChangeEmailForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(NEW_EMAIL_LABEL),
      "new@example.com",
    );
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Save and send verification email",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Your session has expired. Sign in again and try again.",
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
      <ChangeEmailForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(NEW_EMAIL_LABEL),
      "new@example.com",
    );
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Save and send verification email",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Could not change the email address. Please try again.",
    );
  },
};
