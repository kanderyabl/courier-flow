import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import type { CreateOrderFormProps } from "../types";
import { CreateOrderForm } from "../ui";

const PICKUP_ADDRESS_LABEL = /^Pickup address\s*\*?$/;
const DELIVERY_ADDRESS_LABEL = /^Delivery address\s*\*?$/;
const RECIPIENT_NAME_LABEL = /^Recipient name\s*\*?$/;
const RECIPIENT_PHONE_LABEL = /^Recipient phone\s*\*?$/;

const meta = {
  title: "Features/Order/CreateOrderForm",
  component: CreateOrderForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    autoFocus: false,
    cancelHref: "/en/orders",
    onSubmitAction: fn<CreateOrderFormProps["onSubmitAction"]>(
      async () => undefined,
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "48px 16px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateOrderForm>;

export default meta;

type Story = StoryObj<typeof meta>;

async function fillRequiredFields(canvas: ReturnType<typeof within>) {
  await userEvent.type(
    canvas.getByLabelText(PICKUP_ADDRESS_LABEL),
    "Plac Europejski 1, Warszawa",
  );
  await userEvent.type(
    canvas.getByLabelText(DELIVERY_ADDRESS_LABEL),
    "Marszałkowska 126/134, Warszawa",
  );
  await userEvent.type(
    canvas.getByLabelText(RECIPIENT_NAME_LABEL),
    "Anna Kowalska",
  );
  await userEvent.type(
    canvas.getByLabelText(RECIPIENT_PHONE_LABEL),
    "+48 123-456-789",
  );
}

export const Default: Story = {};

export const NormalizedPayload: Story = {
  args: {
    onSubmitAction: fn<CreateOrderFormProps["onSubmitAction"]>(
      async () => undefined,
    ),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await fillRequiredFields(canvas);

    await userEvent.click(
      canvas.getByRole("button", {
        name: "Create order",
      }),
    );

    await expect(args.onSubmitAction).toHaveBeenCalledWith({
      pickupAddress: "Plac Europejski 1, Warszawa",
      deliveryAddress: "Marszałkowska 126/134, Warszawa",
      recipientName: "Anna Kowalska",
      recipientPhone: "+48123456789",
      comment: null,
    });
  },
};

export const ValidationErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", {
        name: "Create order",
      }),
    );

    await expect(await canvas.findAllByRole("alert")).toHaveLength(4);
    await expect(canvas.getByLabelText(PICKUP_ADDRESS_LABEL)).toHaveFocus();
  },
};

export const Submitting: Story = {
  args: {
    onSubmitAction: fn<CreateOrderFormProps["onSubmitAction"]>(
      () => new Promise<void>(() => undefined),
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillRequiredFields(canvas);

    await userEvent.click(
      canvas.getByRole("button", {
        name: "Create order",
      }),
    );

    await expect(
      canvas.getByRole("button", {
        name: "Creating order...",
      }),
    ).toBeDisabled();
    await expect(canvas.getByLabelText(PICKUP_ADDRESS_LABEL)).toHaveAttribute(
      "readonly",
    );
  },
};

export const ServerError: Story = {
  args: {
    onSubmitAction: fn<CreateOrderFormProps["onSubmitAction"]>(async () => {
      throw new Error("CREATE_ORDER_FAILED");
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillRequiredFields(canvas);

    await userEvent.click(
      canvas.getByRole("button", {
        name: "Create order",
      }),
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Could not create the order. Please try again.",
    );
  },
};
