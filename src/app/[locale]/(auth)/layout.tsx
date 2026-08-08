import { redirect } from "next/navigation";

import { getCurrentSessionFromCookies } from "@/shared/lib/session";

type AuthPagesLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AuthPagesLayout({
  children,
  params,
}: AuthPagesLayoutProps) {
  const [{ locale }, session] = await Promise.all([
    params,
    getCurrentSessionFromCookies(),
  ]);

  if (session) {
    redirect(
      session.user.emailVerifiedAt
        ? `/${locale}`
        : `/${locale}/verify-email`,
    );
  }

  return children;
}
