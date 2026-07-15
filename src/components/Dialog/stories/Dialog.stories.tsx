import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

import { Dialog } from "../ui";

type DialogExampleProps = {
  withDescription?: boolean;
  withFooter?: boolean;
};

function DialogExample({ withDescription, withFooter }: DialogExampleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open dialog</Button>

      <Dialog
        open={isOpen}
        title="Change phone number"
        description={
          withDescription
            ? "Enter a new phone number to receive another verification code."
            : undefined
        }
        closeLabel="Close dialog"
        onCloseAction={() => setIsOpen(false)}
        footer={
          withFooter ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>

              <Button type="button" onClick={() => setIsOpen(false)}>
                Save
              </Button>
            </>
          ) : undefined
        }
      >
        <Text>Dialog content will be displayed here.</Text>
      </Dialog>
    </>
  );
}

const meta = {
  title: "Shared/UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    open: false,
    title: "Dialog title",
    children: null,
    onCloseAction: () => undefined,
  },
  argTypes: {
    open: {
      control: false,
    },
    children: {
      control: false,
    },
    footer: {
      control: false,
    },
    onCloseAction: {
      control: false,
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    closeOnBackdrop: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <DialogExample />,
};

export const WithDescription: Story = {
  render: () => <DialogExample withDescription />,
};

export const WithFooter: Story = {
  render: () => <DialogExample withDescription withFooter />,
};

export const LongContent: Story = {
  render: () => {
    function LongContentExample() {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <>
          <Button onClick={() => setIsOpen(true)}>Open long dialog</Button>

          <Dialog
            open={isOpen}
            title="Long dialog"
            description="This example demonstrates scrolling."
            onCloseAction={() => setIsOpen(false)}
          >
            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {Array.from({ length: 20 }).map((_, index) => (
                <Text key={index}>Dialog content row {index + 1}</Text>
              ))}
            </div>
          </Dialog>
        </>
      );
    }

    return <LongContentExample />;
  },
};
