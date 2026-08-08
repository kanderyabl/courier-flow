import { ChangeEmailFormContainer } from "@/features/auth/change-email";
import { AuthLayout } from "@/widgets/AuthLayout";

type ChangeEmailPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function ChangeEmailPage({
  params,
}: ChangeEmailPageProps) {
  const { locale } = await params;

  return (
    <AuthLayout>
      <ChangeEmailFormContainer cancelHref={`/${locale}/verify-email`} />
    </AuthLayout>
  );
}
