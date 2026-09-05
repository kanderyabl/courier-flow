import styles from "./page.module.css";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { SignOutButton } from "@/features/auth/sign-out";

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("HomePage");
  const orderList = useTranslations("order.list");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>

          <Button as="link" href={`/${locale}/orders`}>
            {orderList("title")}
          </Button>
        </div>

        <SignOutButton />
      </main>
    </div>
  );
}
