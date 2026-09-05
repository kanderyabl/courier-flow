import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { OrderDetailsItem } from "@/entities/order";

import { OrderDetails } from "../ui";

const order = {
  id: "8612dbeb-8914-4efc-a760-ff5af23f05cd",
  pickupAddress: "Plac Europejski 1, Warszawa",
  deliveryAddress: "Marszałkowska 126/134, Warszawa",
  recipientName: "Anna Kowalska",
  recipientPhone: "+48123456789",
  comment: "Please call five minutes before arrival.",
  status: "assigned",
  createdAt: "2026-06-15T12:00:00.000Z",
  updatedAt: "2026-06-15T12:18:00.000Z",
} satisfies OrderDetailsItem;

const meta = {
  title: "Widgets/Order/OrderDetails",
  component: OrderDetails,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof OrderDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    state: "ready",
    order,
  },
};

export const WithoutComment: Story = {
  args: {
    state: "ready",
    order: {
      ...order,
      comment: null,
      status: "pending",
    },
  },
};

export const Loading: Story = {
  args: {
    state: "loading",
  },
};

export const NotFound: Story = {
  args: {
    state: "not-found",
  },
};

export const Error: Story = {
  args: {
    state: "error",
    onRetryAction: fn(),
  },
};
