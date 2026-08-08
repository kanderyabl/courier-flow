import { ChangePhoneForm } from "@/features/auth/change-phone";
import { AuthLayout } from "@/widgets/AuthLayout";

type ChangePhonePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function ChangePhonePage({
  params,
}: ChangePhonePageProps) {
  const { locale } = await params;

  return (
    <AuthLayout>
      <ChangePhoneForm cancelHref={`/${locale}/verify-phone`} />
    </AuthLayout>
  );
}
