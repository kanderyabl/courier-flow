import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PasswordInput } from "../ui";

const meta = {
  title: "Shared/UI/PasswordInput",
  component: PasswordInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
    },
    hint: {
      control: "text",
    },
    error: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    required: {
      control: "boolean",
    },
    showPasswordLabel: {
      control: "text",
    },
    hidePasswordLabel: {
      control: "text",
    },
    autoComplete: {
      control: "select",
      options: ["off", "current-password", "new-password"],
    },
  },
  args: {
    id: "password",
    label: "Password",
    placeholder: "Enter your password",
    autoComplete: "current-password",
    disabled: false,
    required: false,
    showPasswordLabel: "Show password",
    hidePasswordLabel: "Hide password",
  },
} satisfies Meta<typeof PasswordInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Registration: Story = {
  args: {
    id: "registration-password",
    label: "Password",
    placeholder: "Create a password",
    hint: "Use at least 8 characters",
    required: true,
    autoComplete: "new-password",
  },
};

export const WithValue: Story = {
  args: {
    id: "password-value",
    label: "Password",
    defaultValue: "Secret123",
  },
};

export const WithError: Story = {
  args: {
    id: "password-error",
    label: "Password",
    error: "Password must contain at least 8 characters",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    id: "password-disabled",
    label: "Password",
    placeholder: "Enter your password",
    disabled: true,
  },
};

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },

  render: () => (
    <div style={{ display: "grid", gap: "20px", width: "360px" }}>
      <PasswordInput
        id="password-default"
        label="Password"
        placeholder="Enter your password"
      />

      <PasswordInput
        id="password-hint"
        label="New password"
        placeholder="Create a password"
        hint="Use at least 8 characters"
        autoComplete="new-password"
      />

      <PasswordInput
        id="password-error"
        label="Password"
        error="Password is required"
      />

      <PasswordInput id="password-disabled" label="Password" disabled />
    </div>
  ),
};
