import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "../ui";

const meta = {
  title: "Shared/UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "primary", "success", "warning", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    children: {
      control: "text",
    },
  },
  args: {
    variant: "neutral",
    size: "md",
    children: "Badge",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: {
    variant: "neutral",
    children: "Neutral",
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Delivered",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "In progress",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Cancelled",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    children: "Medium",
  },
};

export const AllVariants: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      <Badge variant="neutral">New</Badge>
      <Badge variant="primary">Assigned</Badge>
      <Badge variant="warning">In progress</Badge>
      <Badge variant="success">Delivered</Badge>
      <Badge variant="danger">Cancelled</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};
