import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OtpInput } from "../ui";

type OtpExampleProps = {
  initialValue?: string;
  length?: number;
  error?: string;
  disabled?: boolean;
};

function OtpExample({
  initialValue = "",
  length = 6,
  error,
  disabled,
}: OtpExampleProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <div style={{ width: "380px" }}>
      <OtpInput
        id="verification-code"
        name="code"
        label="Verification code"
        value={value}
        length={length}
        error={error}
        disabled={disabled}
        digitAriaLabel="Digit"
        onValueChangeAction={setValue}
      />
    </div>
  );
}

const meta = {
  title: "Shared/UI/OtpInput",
  component: OtpInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    value: "",
    length: 6,
    onValueChangeAction: () => undefined,
  },
  argTypes: {
    value: {
      control: false,
    },
    onValueChangeAction: {
      control: false,
    },
    onCompleteAction: {
      control: false,
    },
    length: {
      control: {
        type: "number",
        min: 4,
        max: 8,
      },
    },
    disabled: {
      control: "boolean",
    },
    error: {
      control: "text",
    },
  },
} satisfies Meta<typeof OtpInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <OtpExample />,
};

export const WithValue: Story = {
  render: () => <OtpExample initialValue="528193" />,
};

export const WithError: Story = {
  render: () => <OtpExample error="The verification code is invalid" />,
};

export const Disabled: Story = {
  render: () => <OtpExample initialValue="528193" disabled />,
};

export const FourDigits: Story = {
  render: () => <OtpExample length={4} />,
};

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },

  render: () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <OtpExample />
      <OtpExample initialValue="528193" />
      <OtpExample error="The verification code is invalid" />
      <OtpExample initialValue="528193" disabled />
    </div>
  ),
};
