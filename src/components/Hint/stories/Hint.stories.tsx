import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Hint } from "../ui";

const meta = {
  title: "Shared/UI/Hint",
  component: Hint,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "success", "warning"],
    },
    children: {
      control: "text",
    },
  },
  args: {
    variant: "default",
    children: "This is a hint message",
  },
} satisfies Meta<typeof Hint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    children: "This field is optional",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    children: "This field is required",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Everything looks good",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Please check this value before saving",
  },
};

export const LongText: Story = {
  args: {
    variant: "default",
    children:
      "This is a longer hint message that explains what the user should enter into this field.",
  },
};

export const AllVariants: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "16px", width: "360px" }}>
      <Hint variant="default">Default hint message</Hint>
      <Hint variant="error">Error hint message</Hint>
      <Hint variant="success">Success hint message</Hint>
      <Hint variant="warning">Warning hint message</Hint>
    </div>
  ),
};
