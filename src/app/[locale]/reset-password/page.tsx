import { ResetPasswordForm } from "@/features/auth/reset-password";
import { AuthLayout } from "@/widgets/AuthLayout";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  const resetToken =
    typeof token === "string" && token.trim().length > 0 ? token : undefined;

  return (
    <AuthLayout>
      <ResetPasswordForm token={resetToken} />
    </AuthLayout>
  );
}
