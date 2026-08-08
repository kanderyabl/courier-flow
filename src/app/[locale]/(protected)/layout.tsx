import { redirect } from "next/navigation";

import { getCurrentSessionFromCookies } from "@/shared/lib/session";

type ProtectedPagesLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function ProtectedPagesLayout({
  children,
  params,
}: ProtectedPagesLayoutProps) {
  const [{ locale }, session] = await Promise.all([
    params,
    getCurrentSessionFromCookies(),
  ]);

  if (!session) {
    redirect(`/${locale}/sign-in`);
  }

  if (!session.user.emailVerifiedAt) {
    redirect(`/${locale}/verify-email`);
  }

  return children;
}
