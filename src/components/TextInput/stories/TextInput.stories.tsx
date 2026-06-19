import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps, ReactNode } from "react";

import { TextInput } from "../ui";

type IconName = "none" | "search" | "user";

type TextInputStoryArgs = ComponentProps<typeof TextInput> & {
  iconName?: IconName;
};

const getEndIcon = (iconName?: IconName): ReactNode => {
  if (iconName === "search") {
    return "🔍";
  }

  if (iconName === "user") {
    return "👤";
  }

  return undefined;
};

const meta = {
  title: "Shared/UI/TextInput",
  component: TextInput,
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
    hideLabel: {
      control: "boolean",
    },
    iconName: {
      control: "select",
      options: ["none", "search", "user"],
    },
    endIcon: {
      table: {
        disable: true,
      },
    },
    autoComplete: {
      control: "select",
      options: ["off", "on", "email", "name", "username", "current-password"],
    },
    required: {
      control: "boolean",
    },
  },
  args: {
    id: "email",
    label: "Email",
    placeholder: "Enter your email",
    hint: "We will use this email for notifications",
    disabled: false,
    hideLabel: false,
    iconName: "none",
  },
  render: ({ iconName, ...args }) => (
    <TextInput {...args} endIcon={getEndIcon(iconName)} />
  ),
} satisfies Meta<TextInputStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "email-default",
    label: "Email",
    placeholder: "Enter your email",
    required: false,
    autoComplete: "off",
  },
};

export const WithHint: Story = {
  args: {
    id: "email-hint",
    label: "Email",
    placeholder: "Enter your email",
    hint: "We will use this email for notifications",
    required: false,
    autoComplete: "off",
  },
};

export const WithError: Story = {
  args: {
    id: "email-error",
    label: "Email",
    placeholder: "Enter your email",
    error: "Email is required",
    required: false,
    autoComplete: "off",
  },
};

export const Disabled: Story = {
  args: {
    id: "email-disabled",
    label: "Email",
    placeholder: "Enter your email",
    disabled: true,
    required: false,
    autoComplete: "off",
  },
};

export const WithValue: Story = {
  args: {
    id: "email-value",
    label: "Email",
    defaultValue: "courier@example.com",
    required: false,
    autoComplete: "off",
  },
};

export const HiddenLabel: Story = {
  args: {
    id: "search-hidden-label",
    label: "Search orders",
    hideLabel: true,
    placeholder: "Search orders",
    required: false,
    autoComplete: "off",
  },
};

export const WithEndIcon: Story = {
  args: {
    id: "search-icon",
    label: "Search",
    placeholder: "Search orders",
    iconName: "search",
    required: false,
    autoComplete: "off",
  },
};

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "20px", width: "360px" }}>
      <TextInput id="all-default" label="Default" placeholder="Enter value" />

      <TextInput
        id="all-hint"
        label="With hint"
        placeholder="Enter value"
        hint="This is a helper text"
      />

      <TextInput
        id="all-error"
        label="With error"
        placeholder="Enter value"
        error="This field is required"
      />

      <TextInput
        id="all-disabled"
        label="Disabled"
        placeholder="Enter value"
        disabled
      />

      <TextInput
        id="all-icon-search"
        label="With search icon"
        placeholder="Search"
        endIcon="🔍"
      />

      <TextInput
        id="all-icon-user"
        label="With user icon"
        placeholder="User name"
        endIcon="👤"
      />
    </div>
  ),
};
