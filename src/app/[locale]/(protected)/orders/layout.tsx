import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/Container";
import { SignOutButton } from "@/features/auth/sign-out";

import styles from "./layout.module.css";

type OrdersLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function OrdersLayout({
  children,
  params,
}: OrdersLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order.list" });
  const ordersHref = `/${locale}/orders`;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Container size="lg" className={styles.headerInner}>
          <Link href={ordersHref} className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              CF
            </span>
            <span className={styles.brandName}>Courier Flow</span>
          </Link>

          <div className={styles.navigation}>
            <Link
              href={ordersHref}
              className={styles.navLink}
              aria-current="page"
            >
              {t("title")}
            </Link>
            <SignOutButton />
          </div>
        </Container>
      </header>

      {children}
    </div>
  );
}
