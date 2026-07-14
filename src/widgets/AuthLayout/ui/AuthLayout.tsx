import { clsx } from "clsx";
import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { Text } from "@/components/Text";

import type { AuthLayoutProps } from "../types";

import styles from "./AuthLayout.module.css";

export function AuthLayout({ children, className, ...props }: AuthLayoutProps) {
  return (
    <main className={clsx(styles.layout, className)} {...props}>
      <Container size="sm">
        <div className={styles.content}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logoLink}>
              <Image
                src="/icon-192x192.png"
                alt="Courier Flow"
                width={48}
                height={48}
                priority
              />

              <Text as="span" variant="h3" className={styles.logoText}>
                Courier Flow
              </Text>
            </Link>
          </div>

          <Card variant="elevated" padding="lg" className={styles.card}>
            {children}
          </Card>
        </div>
      </Container>
    </main>
  );
}
