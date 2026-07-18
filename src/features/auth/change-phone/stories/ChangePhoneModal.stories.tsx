import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

import { ChangePhoneModal } from "../ui";

function ChangePhoneModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState<string>();

  return (
    <div
      style={{
        display: "grid",
        gap: "20px",
      }}
    >
      <Button type="button" onClick={() => setIsOpen(true)}>
        Change phone number
      </Button>

      {submittedPhone && (
        <Text color="success">Submitted phone: {submittedPhone}</Text>
      )}

      <ChangePhoneModal
        open={isOpen}
        onCloseAction={() => {
          setIsOpen(false);
        }}
        onSubmitAction={async ({ phone }) => {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 1000);
          });

          setSubmittedPhone(phone);
        }}
      />
    </div>
  );
}

const meta = {
  title: "Features/Auth/ChangePhoneModal",
  component: ChangePhoneModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    open: false,
    onCloseAction: () => undefined,
    onSubmitAction: async () => undefined,
  },
  argTypes: {
    open: {
      control: false,
    },
    onCloseAction: {
      control: false,
    },
    onSubmitAction: {
      control: false,
    },
  },
} satisfies Meta<typeof ChangePhoneModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ChangePhoneModalExample />,
};
