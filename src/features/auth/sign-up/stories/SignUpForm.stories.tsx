import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Card } from "@/components/Card";

import { SignUpForm } from "../ui";

const meta = {
  title: "Features/Auth/SignUpForm",
  component: SignUpForm,

  parameters: {
    layout: "centered",
  },

  tags: ["autodocs"],

  args: {
    onSubmitAction: fn(),
  },

  argTypes: {
    onSubmitAction: {
      control: false,
    },
  },

  decorators: [
    (Story) => (
      <Card variant="elevated" padding="lg" style={{ width: "440px" }}>
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof SignUpForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSubmitDelay: Story = {
  args: {
    onSubmitAction: fn(async () => {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1500);
      });
    }),
  },
};
