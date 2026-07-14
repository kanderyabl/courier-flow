import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/Button";

import { EmptyState } from "../ui";

const meta = {
  title: "Shared/UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    icon: {
      control: false,
    },
    action: {
      control: false,
    },
  },
  args: {
    title: "No data yet",
    description: "There is nothing to show here right now.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "No data yet",
    description: "There is nothing to show here right now.",
  },
};

export const Orders: Story = {
  args: {
    title: "No orders yet",
    description: "Create your first order to start managing deliveries.",
    icon: "📦",
    action: <Button>Create order</Button>,
  },
};

export const Couriers: Story = {
  args: {
    title: "No couriers found",
    description: "Add a courier or change your search filters.",
    icon: "🚴",
    action: <Button variant="secondary">Add courier</Button>,
  },
};

export const SearchResults: Story = {
  args: {
    title: "Nothing found",
    description: "Try changing your search query or filters.",
    icon: "🔍",
  },
};

export const WithoutDescription: Story = {
  args: {
    title: "No results",
    icon: "📭",
  },
};

export const WithAction: Story = {
  args: {
    title: "No orders yet",
    description: "Create your first order to start managing deliveries.",
    action: <Button>Create order</Button>,
  },
};

export const AllExamples: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "24px", width: "520px" }}>
      <EmptyState
        title="No orders yet"
        description="Create your first order to start managing deliveries."
        icon="📦"
        action={<Button>Create order</Button>}
      />

      <EmptyState
        title="Nothing found"
        description="Try changing your search query or filters."
        icon="🔍"
      />
    </div>
  ),
};
