import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ua", "es", "fr", "zh", "hi"],
  defaultLocale: "en",
  localeDetection: true,
});
