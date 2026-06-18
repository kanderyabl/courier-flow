import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PwaRegister } from "@/components/PwaRegister/PwaRegister";
import { routing } from "@/i18n/routing";
import { inter } from "@/shared/config/fonts";

import "../globals.css";

export const metadata: Metadata = {
  title: "Courier Flow",
  description: "Dashboard for managing couriers, orders and deliveries",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider>
          <PwaRegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}