import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ORDER_STATUSES } from "../constants";

import { OrderStatusBadge } from "@/entities/order";

const meta = {
  title: "Entities/Order/OrderStatusBadge",
  component: OrderStatusBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ORDER_STATUSES,
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    status: "new",
    size: "md",
  },
} satisfies Meta<typeof OrderStatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const New: Story = {
  args: {
    status: "new",
  },
};

export const Assigned: Story = {
  args: {
    status: "assigned",
  },
};

export const InProgress: Story = {
  args: {
    status: "in_progress",
  },
};

export const Delivered: Story = {
  args: {
    status: "delivered",
  },
};

export const Cancelled: Story = {
  args: {
    status: "cancelled",
  },
};

export const Small: Story = {
  args: {
    status: "in_progress",
    size: "sm",
  },
};

export const AllStatuses: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      {ORDER_STATUSES.map((status) => (
        <OrderStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
