import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Text } from "@/components/Text";
import { AuthLayout } from "@/widgets/AuthLayout";

import { SignInForm } from "../ui";

const EMAIL_LABEL = /^Email address\s*\*?$/;
const PASSWORD_LABEL = /^Password\s*\*?$/;

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

export const ValidationErrors: Story = {
  render: (args) => (
    <AuthLayout>
      <SignInForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = canvas.getByLabelText(EMAIL_LABEL);
    const passwordInput = canvas.getByLabelText(PASSWORD_LABEL);

    await userEvent.click(
      canvas.getByRole("button", {
        name: "Sign in",
      }),
    );

    await expect(emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(emailInput).toHaveFocus());
  },
};

export const WithSubmittingState: Story = {
  render: (args) => (
    <AuthLayout>
      <SignInForm
        {...args}
        onSubmitAction={() => new Promise<void>(() => undefined)}
      />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = canvas.getByLabelText(EMAIL_LABEL);
    const passwordInput = canvas.getByLabelText(PASSWORD_LABEL);

    await userEvent.type(emailInput, "user@example.com");
    await userEvent.type(passwordInput, "Password1!");
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Sign in",
      }),
    );

    await expect(
      canvas.getByRole("button", {
        name: "Signing in...",
      }),
    ).toBeDisabled();
    await expect(emailInput).toHaveAttribute("readonly");
    await expect(emailInput).not.toBeDisabled();
    await expect(passwordInput).toHaveAttribute("readonly");
    await expect(passwordInput).not.toBeDisabled();
  },
};

export const InvalidCredentials: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("INVALID_CREDENTIALS");
    },
  },
  render: (args) => (
    <AuthLayout>
      <SignInForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(EMAIL_LABEL),
      "user@example.com",
    );
    await userEvent.type(canvas.getByLabelText(PASSWORD_LABEL), "WrongPassword");
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Sign in",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "The email or password is incorrect.",
    );
  },
};

export const RateLimited: Story = {
  args: {
    onSubmitAction: async () => {
      throw new Error("SIGN_IN_RATE_LIMITED");
    },
  },
  render: (args) => (
    <AuthLayout>
      <SignInForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(EMAIL_LABEL),
      "user@example.com",
    );
    await userEvent.type(canvas.getByLabelText(PASSWORD_LABEL), "Password1!");
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Sign in",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Too many sign-in attempts. Please wait and try again.",
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
      <SignInForm {...args} />
    </AuthLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(EMAIL_LABEL),
      "user@example.com",
    );
    await userEvent.type(canvas.getByLabelText(PASSWORD_LABEL), "Password1!");
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Sign in",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Could not sign in. Please try again.",
    );
  },
};
