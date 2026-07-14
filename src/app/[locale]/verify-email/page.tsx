import { VerifyEmailCard } from "@/features/auth/verify-email";
import { AuthLayout } from "@/widgets/AuthLayout";

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <VerifyEmailCard />
    </AuthLayout>
  );
}
