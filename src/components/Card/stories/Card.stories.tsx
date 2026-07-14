import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@/components/Badge";
import { Text } from "@/components/Text";

import { Card } from "../ui";

const meta = {
  title: "Shared/UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outlined", "elevated"],
    },
    padding: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    children: {
      control: false,
    },
  },
  args: {
    variant: "default",
    padding: "md",
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} style={{ width: "320px" }}>
      <Text as="h3" variant="h3">
        Total orders
      </Text>
      <Text color="muted">Orders created today</Text>
    </Card>
  ),
};

export const Outlined: Story = {
  args: {
    variant: "outlined",
  },
  render: (args) => (
    <Card {...args} style={{ width: "320px" }}>
      <Text as="h3" variant="h3">
        Active couriers
      </Text>
      <Text color="muted">Couriers currently online</Text>
    </Card>
  ),
};

export const Elevated: Story = {
  args: {
    variant: "elevated",
  },
  render: (args) => (
    <Card {...args} style={{ width: "320px" }}>
      <Text as="h3" variant="h3">
        Revenue
      </Text>
      <Text color="muted">Estimated revenue today</Text>
    </Card>
  ),
};

export const SmallPadding: Story = {
  args: {
    padding: "sm",
  },
  render: (args) => (
    <Card {...args} style={{ width: "320px" }}>
      <Text>Small padding card</Text>
    </Card>
  ),
};

export const LargePadding: Story = {
  args: {
    padding: "lg",
  },
  render: (args) => (
    <Card {...args} style={{ width: "320px" }}>
      <Text>Large padding card</Text>
    </Card>
  ),
};

export const OrderCard: Story = {
  render: () => (
    <Card variant="default" padding="md" style={{ width: "360px" }}>
      <div style={{ display: "grid", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <Text as="h3" variant="h3">
            Order #1248
          </Text>

          <Badge variant="warning">In progress</Badge>
        </div>

        <Text color="muted">Wrocław, Magnolia Park</Text>

        <Text>Courier assigned. Estimated delivery time: 24 minutes.</Text>
      </div>
    </Card>
  ),
};

export const AllVariants: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "20px", width: "360px" }}>
      <Card variant="default">
        <Text variant="body">Default card</Text>
      </Card>

      <Card variant="outlined">
        <Text variant="body">Outlined card</Text>
      </Card>

      <Card variant="elevated">
        <Text variant="body">Elevated card</Text>
      </Card>
    </div>
  ),
};
