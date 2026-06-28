import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "@/components/Textarea";

const meta = {
  title: "Shared/UI/Textarea",
  component: Textarea,
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
    resize: {
      control: "select",
      options: ["none", "vertical", "horizontal", "both"],
    },
  },
  args: {
    id: "comment",
    label: "Comment",
    placeholder: "Add delivery note",
    hint: "Optional note for courier",
    disabled: false,
    required: false,
    hideLabel: false,
    resize: "vertical",
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "comment-default",
    label: "Comment",
    placeholder: "Add delivery note",
  },
};

export const WithHint: Story = {
  args: {
    id: "comment-hint",
    label: "Comment",
    placeholder: "Add delivery note",
    hint: "This note will be visible to the courier",
  },
};

export const WithError: Story = {
  args: {
    id: "comment-error",
    label: "Comment",
    placeholder: "Add delivery note",
    error: "Comment is required",
  },
};

export const Required: Story = {
  args: {
    id: "comment-required",
    label: "Comment",
    placeholder: "Add delivery note",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    id: "comment-disabled",
    label: "Comment",
    placeholder: "Add delivery note",
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    id: "comment-value",
    label: "Comment",
    defaultValue: "Please call the client before arrival.",
  },
};

export const HiddenLabel: Story = {
  args: {
    id: "comment-hidden-label",
    label: "Comment",
    hideLabel: true,
    placeholder: "Add delivery note",
  },
};

export const NoResize: Story = {
  args: {
    id: "comment-no-resize",
    label: "Comment",
    placeholder: "Add delivery note",
    resize: "none",
  },
};

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "grid", gap: "20px", width: "360px" }}>
      <Textarea
        id="all-default"
        label="Default"
        placeholder="Add delivery note"
      />

      <Textarea
        id="all-hint"
        label="With hint"
        placeholder="Add delivery note"
        hint="This note will be visible to the courier"
      />

      <Textarea
        id="all-error"
        label="With error"
        placeholder="Add delivery note"
        error="Comment is required"
      />

      <Textarea
        id="all-required"
        label="Required"
        placeholder="Add delivery note"
        required
      />

      <Textarea
        id="all-disabled"
        label="Disabled"
        placeholder="Add delivery note"
        disabled
      />
    </div>
  ),
};
