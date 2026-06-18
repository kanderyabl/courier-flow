import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Text } from "../ui";

const meta = {
  title: "Shared/UI/Text",
  component: Text,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    as: {
      control: "select",
      options: ["p", "span", "h1", "h2", "h3", "label"],
    },
    variant: {
      control: "select",
      options: [
        "h1",
        "h2",
        "h3",
        "body",
        "bodySmall",
        "caption",
        "label",
        "button",
      ],
    },
    color: {
      control: "select",
      options: ["default", "muted", "primary", "success", "warning", "danger"],
    },
    children: {
      control: "text",
    },
  },
  args: {
    as: "p",
    variant: "body",
    color: "default",
    children: "Courier Flow text component",
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Body: Story = {
  args: {
    variant: "body",
    children: "Dashboard for managing couriers, orders and deliveries.",
  },
};

export const Heading1: Story = {
  args: {
    as: "h1",
    variant: "h1",
    children: "Courier Flow",
  },
};

export const Heading2: Story = {
  args: {
    as: "h2",
    variant: "h2",
    children: "Orders dashboard",
  },
};

export const Heading3: Story = {
  args: {
    as: "h3",
    variant: "h3",
    children: "Active couriers",
  },
};

export const Muted: Story = {
  args: {
    variant: "bodySmall",
    color: "muted",
    children: "Last updated 2 minutes ago",
  },
};

export const Caption: Story = {
  args: {
    variant: "caption",
    color: "muted",
    children: "Optional field",
  },
};

export const Label: Story = {
  args: {
    as: "label",
    variant: "label",
    children: "Email address",
  },
};

export const AllVariants: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "16px", width: "520px" }}>
      <Text as="h1" variant="h1">
        Heading 1
      </Text>

      <Text as="h2" variant="h2">
        Heading 2
      </Text>

      <Text as="h3" variant="h3">
        Heading 3
      </Text>

      <Text variant="body">
        Body text. Used for normal paragraphs and readable interface text.
      </Text>

      <Text variant="bodySmall" color="muted">
        Body small text. Used for secondary information.
      </Text>

      <Text variant="caption" color="muted">
        Caption text. Used for small helper notes.
      </Text>

      <Text as="label" variant="label">
        Label text
      </Text>

      <Text as="span" variant="button">
        Button text
      </Text>
    </div>
  ),
};

export const AllColors: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "12px", width: "360px" }}>
      <Text color="default">Default text</Text>
      <Text color="muted">Muted text</Text>
      <Text color="primary">Primary text</Text>
      <Text color="success">Success text</Text>
      <Text color="warning">Warning text</Text>
      <Text color="danger">Danger text</Text>
    </div>
  ),
};
