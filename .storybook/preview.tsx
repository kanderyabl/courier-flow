import type { Preview } from "@storybook/nextjs-vite";

import { inter } from "../src/shared/config/fonts";
import "../src/app/globals.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className={inter.className}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: "todo",
    },
  },
};

export default preview;