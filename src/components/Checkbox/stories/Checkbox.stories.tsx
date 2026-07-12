import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox } from "@/components/Checkbox";

const meta = {
  title: "Shared/UI/Checkbox",
  component: Checkbox,
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
    disabled: {
      control: "boolean",
    },
    required: {
      control: "boolean",
    },
    defaultChecked: {
      control: "boolean",
    },
  },
  args: {
    id: "checkbox",
    label: "Checkbox label",
    disabled: false,
    required: false,
    defaultChecked: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "checkbox-default",
    label: "Remember me",
  },
};

export const Checked: Story = {
  args: {
    id: "checkbox-checked",
    label: "Remember me",
    defaultChecked: true,
  },
};

export const WithHint: Story = {
  args: {
    id: "checkbox-hint",
    label: "Send me delivery notifications",
    hint: "You can disable notifications later.",
  },
};

export const WithError: Story = {
  args: {
    id: "checkbox-error",
    label: "I agree to the terms",
    error: "You must accept the terms to continue.",
  },
};

export const Required: Story = {
  args: {
    id: "checkbox-required",
    label: "I agree to the terms",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    id: "checkbox-disabled",
    label: "Disabled checkbox",
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    id: "checkbox-disabled-checked",
    label: "Disabled checked checkbox",
    disabled: true,
    defaultChecked: true,
  },
};

export const Terms: Story = {
  args: {
    id: "checkbox-terms",
    required: true,
    label: (
      <>
        I agree to the <a href="#terms">Terms of Service</a> and{" "}
        <a href="#privacy">Privacy Policy</a>
      </>
    ),
  },
};

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "20px", width: "360px" }}>
      <Checkbox id="all-default" label="Default" />

      <Checkbox id="all-checked" label="Checked" defaultChecked />

      <Checkbox
        id="all-hint"
        label="With hint"
        hint="Additional information about this option."
      />

      <Checkbox
        id="all-error"
        label="With error"
        error="This option is required."
      />

      <Checkbox id="all-required" label="Required" required />

      <Checkbox id="all-disabled" label="Disabled" disabled />
    </div>
  ),
};
