import styles from "./page.module.css";
import { useTranslations } from "next-intl";

import { SignOutButton } from "@/features/auth/sign-out";

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>

        <SignOutButton />
      </main>
    </div>
  );
}
