import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../ui";

const meta = {
  title: "Shared/UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    fullWidth: {
      control: "boolean",
    },
    children: {
      control: "text",
    },
  },
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    fullWidth: false,
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost",
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

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large",
  },
};

export const FullWidth: Story = {
  parameters: {
    layout: "padded",
  },
  args: {
    fullWidth: true,
    children: "Full width",
  },
  render: (args) => (
    <div style={{ width: "320px" }}>
      <Button {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled",
  },
};

export const LinkButton: Story = {
  args: {
    as: "link",
    href: "/dashboard",
    children: "Go to dashboard",
  },
};

export const AllVariants: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Button disabled>Disabled</Button>
        <Button as="link" href="/dashboard">
          Link button
        </Button>
      </div>

      <div style={{ width: "320px" }}>
        <Button fullWidth>Full width</Button>
      </div>
    </div>
  ),
};
