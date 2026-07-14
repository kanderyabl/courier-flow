import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card } from "@/components/Card";
import { Skeleton } from "../ui";

const meta = {
  title: "Shared/UI/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "rectangular", "circular"],
    },
    width: {
      control: "text",
    },
    height: {
      control: "text",
    },
    radius: {
      control: "text",
    },
  },
  args: {
    variant: "text",
    width: "240px",
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: "text",
    width: "240px",
  },
};

export const Rectangular: Story = {
  args: {
    variant: "rectangular",
    width: "320px",
    height: 120,
  },
};

export const Circular: Story = {
  args: {
    variant: "circular",
    width: 48,
    height: 48,
  },
};

export const DashboardCardLoading: Story = {
  render: () => (
    <Card style={{ width: "320px" }}>
      <div style={{ display: "grid", gap: "12px" }}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="35%" height={32} />
        <Skeleton width="80%" height={14} />
      </div>
    </Card>
  ),
};

export const OrderCardLoading: Story = {
  render: () => (
    <Card style={{ width: "360px" }}>
      <div style={{ display: "grid", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <Skeleton width="140px" height={24} />
          <Skeleton width="90px" height={24} radius="999px" />
        </div>

        <Skeleton width="100%" height={16} />
        <Skeleton width="75%" height={16} />
      </div>
    </Card>
  ),
};

export const ListLoading: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "16px", width: "420px" }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Skeleton variant="circular" width={40} height={40} />

            <div style={{ display: "grid", gap: "8px", flex: 1 }}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="80%" height={14} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  ),
};
