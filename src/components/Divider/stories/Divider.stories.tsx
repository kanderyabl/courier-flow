import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card } from "@/components/Card";
import { Text } from "@/components/Text";

import { Divider } from "../ui";

const meta = {
  title: "Shared/UI/Divider",
  component: Divider,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    spacing: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
  },
  args: {
    orientation: "horizontal",
    spacing: "md",
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <Card style={{ width: "360px" }}>
      <Text as="h3" variant="h3">
        Order #1248
      </Text>

      <Divider {...args} />

      <Text color="muted">Courier assigned</Text>
    </Card>
  ),
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <Card>
      <div style={{ display: "flex", alignItems: "center", height: "48px" }}>
        <Text>Orders</Text>
        <Divider {...args} />
        <Text>Couriers</Text>
        <Divider {...args} />
        <Text>Revenue</Text>
      </div>
    </Card>
  ),
};

export const NoSpacing: Story = {
  args: {
    spacing: "none",
  },
  render: (args) => (
    <Card style={{ width: "360px" }}>
      <Text>First block</Text>
      <Divider {...args} />
      <Text>Second block</Text>
    </Card>
  ),
};

export const AllSpacing: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "16px", width: "360px" }}>
      <Card>
        <Text>Spacing sm</Text>
        <Divider spacing="sm" />
        <Text color="muted">Small divider spacing</Text>
      </Card>

      <Card>
        <Text>Spacing md</Text>
        <Divider spacing="md" />
        <Text color="muted">Medium divider spacing</Text>
      </Card>

      <Card>
        <Text>Spacing lg</Text>
        <Divider spacing="lg" />
        <Text color="muted">Large divider spacing</Text>
      </Card>
    </div>
  ),
};
