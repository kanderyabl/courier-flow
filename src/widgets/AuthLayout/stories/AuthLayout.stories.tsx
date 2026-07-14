import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Text } from "@/components/Text";

import { AuthLayout } from "../ui";

const meta = {
  title: "Widgets/AuthLayout",
  component: AuthLayout,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    children: null,
  },
} satisfies Meta<typeof AuthLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AuthLayout>
      <div style={{ display: "grid", gap: "12px" }}>
        <Text as="h1" variant="h2">
          Create account
        </Text>

        <Text color="muted">
          Authentication content will be displayed here.
        </Text>
      </div>
    </AuthLayout>
  ),
};
