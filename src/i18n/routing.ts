import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ua", "es", "fr", "zh", "hi"],
  defaultLocale: "en",
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(
  value: string,
): value is AppLocale {
  return routing.locales.some((locale) => locale === value);
}
