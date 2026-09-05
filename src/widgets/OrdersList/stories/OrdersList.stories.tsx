import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { OrderListItem } from "@/entities/order";

import { OrdersList } from "../ui";

const orders = [
  {
    id: "8612dbeb-8914-4efc-a760-ff5af23f05cd",
    pickupAddress: "Plac Europejski 1, Warszawa",
    deliveryAddress: "Marszałkowska 126/134, Warszawa",
    status: "pending",
    createdAt: "2026-06-15T12:00:00.000Z",
  },
  {
    id: "35b613f2-cad8-4fa3-8f26-688fc447a6c5",
    pickupAddress: "Rynek 12, Wrocław",
    deliveryAddress: "Legnicka 58, Wrocław",
    status: "in_progress",
    createdAt: "2026-06-15T10:20:00.000Z",
  },
  {
    id: "21269e01-65f6-4dbf-814a-fd5fa755fc01",
    pickupAddress: "Długa 18, Gdańsk",
    deliveryAddress: "Grunwaldzka 141, Gdańsk",
    status: "delivered",
    createdAt: "2026-06-14T15:45:00.000Z",
  },
] satisfies OrderListItem[];

const meta = {
  title: "Widgets/Order/OrdersList",
  component: OrdersList,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof OrdersList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithOrders: Story = {
  args: {
    state: "ready",
    orders,
  },
};

export const Empty: Story = {
  args: {
    state: "ready",
    orders: [],
  },
};

export const Loading: Story = {
  args: {
    state: "loading",
  },
};

export const Error: Story = {
  args: {
    state: "error",
    onRetryAction: fn(),
  },
};
