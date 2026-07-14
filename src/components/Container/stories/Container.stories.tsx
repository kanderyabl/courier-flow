import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card } from "@/components/Card";
import { Text } from "@/components/Text";

import { Container } from "@/components/Container";

const meta = {
  title: "Shared/UI/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
    },
    children: {
      control: false,
    },
  },
  args: {
    size: "lg",
  },
} satisfies Meta<typeof Container>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Container {...args}>
      <Card>
        <Text as="h2" variant="h2">
          Courier Flow
        </Text>
        <Text color="muted">
          Container limits page width and keeps content aligned.
        </Text>
      </Card>
    </Container>
  ),
};

export const Small: Story = {
  args: {
    size: "sm",
  },
  render: (args) => (
    <Container {...args}>
      <Card>
        <Text>Small container</Text>
      </Card>
    </Container>
  ),
};

export const Medium: Story = {
  args: {
    size: "md",
  },
  render: (args) => (
    <Container {...args}>
      <Card>
        <Text>Medium container</Text>
      </Card>
    </Container>
  ),
};

export const Large: Story = {
  args: {
    size: "lg",
  },
  render: (args) => (
    <Container {...args}>
      <Card>
        <Text>Large container</Text>
      </Card>
    </Container>
  ),
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
  },
  render: (args) => (
    <Container {...args}>
      <Card>
        <Text>Extra large container</Text>
      </Card>
    </Container>
  ),
};

export const Full: Story = {
  args: {
    size: "full",
  },
  render: (args) => (
    <Container {...args}>
      <Card>
        <Text>Full width container</Text>
      </Card>
    </Container>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <Container size="sm">
        <Card>
          <Text>sm — 640px</Text>
        </Card>
      </Container>

      <Container size="md">
        <Card>
          <Text>md — 768px</Text>
        </Card>
      </Container>

      <Container size="lg">
        <Card>
          <Text>lg — 1024px</Text>
        </Card>
      </Container>

      <Container size="xl">
        <Card>
          <Text>xl — 1200px</Text>
        </Card>
      </Container>
    </div>
  ),
};
