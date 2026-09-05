import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OrderCard } from "@/entities/order";

const meta = {
  title: "Entities/Order/OrderCard",
  component: OrderCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    order: {
      id: "8612dbeb-8914-4efc-a760-ff5af23f05cd",
      pickupAddress: "Plac Europejski 1, Warszawa",
      deliveryAddress: "Marszałkowska 126/134, Warszawa",
      status: "pending",
      createdAt: "2026-06-15T12:00:00.000Z",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(100vw - 32px, 470px)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrderCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongAddresses: Story = {
  args: {
    order: {
      ...meta.args.order,
      pickupAddress:
        "Terminal pasażerski Portu Lotniczego Wrocław, Graniczna 190",
      deliveryAddress:
        "Budynek biurowy, wejście od dziedzińca, aleja Architektów 42/18",
      status: "in_progress",
    },
  },
};
