import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar } from "../ui";

const meta = {
  title: "Shared/UI/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    src: {
      control: "text",
    },
    name: {
      control: "text",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    shape: {
      control: "select",
      options: ["circle", "square"],
    },
  },
  args: {
    name: "Vladyslav Talan",
    size: "md",
    shape: "circle",
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Vladyslav Talan",
  },
};

export const OneWordName: Story = {
  args: {
    name: "Courier",
  },
};

export const WithoutName: Story = {
  args: {
    name: undefined,
  },
};

export const Small: Story = {
  args: {
    name: "Vladyslav Talan",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    name: "Vladyslav Talan",
    size: "md",
  },
};

export const Large: Story = {
  args: {
    name: "Vladyslav Talan",
    size: "lg",
  },
};

export const Square: Story = {
  args: {
    name: "Vladyslav Talan",
    shape: "square",
  },
};

export const WithImage: Story = {
  args: {
    name: "Courier",
    src: "https://i.pravatar.cc/100?img=12",
  },
};

export const AllSizes: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <Avatar name="Vladyslav Talan" size="sm" />
      <Avatar name="Vladyslav Talan" size="md" />
      <Avatar name="Vladyslav Talan" size="lg" />
    </div>
  ),
};

export const Couriers: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <Avatar name="Alex Brown" />
      <Avatar name="John Smith" />
      <Avatar name="Maria Green" />
      <Avatar name="Courier" />
    </div>
  ),
};
