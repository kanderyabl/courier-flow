import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select } from "@/components/Select";

const statusOptions = [
  { label: "New", value: "new" },
  { label: "Assigned", value: "assigned" },
  { label: "In progress", value: "in_progress" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const meta = {
  title: "Shared/UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
    },
    hint: {
      control: "text",
    },
    error: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    required: {
      control: "boolean",
    },
    hideLabel: {
      control: "boolean",
    },
    selectSize: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    id: "status",
    label: "Status",
    placeholder: "Select status",
    options: statusOptions,
    selectSize: "md",
    disabled: false,
    required: false,
    hideLabel: false,
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "status-default",
    label: "Status",
    placeholder: "Select status",
    options: statusOptions,
  },
};

export const WithValue: Story = {
  args: {
    id: "status-value",
    label: "Status",
    options: statusOptions,
    defaultValue: "in_progress",
  },
};

export const WithHint: Story = {
  args: {
    id: "status-hint",
    label: "Status",
    placeholder: "Select status",
    hint: "Choose the current order status",
    options: statusOptions,
  },
};

export const WithError: Story = {
  args: {
    id: "status-error",
    label: "Status",
    placeholder: "Select status",
    error: "Status is required",
    options: statusOptions,
  },
};

export const Required: Story = {
  args: {
    id: "status-required",
    label: "Status",
    placeholder: "Select status",
    required: true,
    options: statusOptions,
  },
};

export const Disabled: Story = {
  args: {
    id: "status-disabled",
    label: "Status",
    placeholder: "Select status",
    disabled: true,
    options: statusOptions,
  },
};

export const Small: Story = {
  args: {
    id: "status-small",
    label: "Status",
    placeholder: "Select status",
    selectSize: "sm",
    options: statusOptions,
  },
};

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "20px", width: "360px" }}>
      <Select
        id="all-default"
        label="Default"
        placeholder="Select status"
        options={statusOptions}
      />

      <Select
        id="all-hint"
        label="With hint"
        placeholder="Select status"
        hint="Choose the current order status"
        options={statusOptions}
      />

      <Select
        id="all-error"
        label="With error"
        placeholder="Select status"
        error="Status is required"
        options={statusOptions}
      />

      <Select
        id="all-required"
        label="Required"
        placeholder="Select status"
        required
        options={statusOptions}
      />

      <Select
        id="all-disabled"
        label="Disabled"
        placeholder="Select status"
        disabled
        options={statusOptions}
      />
    </div>
  ),
};
