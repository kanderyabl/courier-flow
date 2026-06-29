import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import { inter } from "../src/shared/config/fonts";
import "../src/app/globals.css";

import enMessages from "../messages/en.json";
import esMessages from "../messages/es.json";
import frMessages from "../messages/fr.json";
import hiMessages from "../messages/hi.json";
import uaMessages from "../messages/ua.json";
import zhMessages from "../messages/zh.json";

const messages = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  hi: hiMessages,
  ua: uaMessages,
  zh: zhMessages,
};

type Locale = keyof typeof messages;

const preview: Preview = {
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Interface language",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "es", title: "Español" },
          { value: "fr", title: "Français" },
          { value: "hi", title: "हिन्दी" },
          { value: "ua", title: "Українська" },
          { value: "zh", title: "中文" },
        ],
      },
    },
  },

  decorators: [
    (Story, context) => {
      const locale = context.globals.locale as Locale;

      return (
        <NextIntlClientProvider locale={locale} messages={messages[locale]}>
          <div className={inter.className}>
            <Story />
          </div>
        </NextIntlClientProvider>
      );
    },
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
