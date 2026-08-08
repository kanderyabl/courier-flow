import { VerifyPhoneForm } from "@/features/auth/verify-phone";
import { AuthLayout } from "@/widgets/AuthLayout";

export default function VerifyPhonePage() {
  return (
    <AuthLayout>
      <VerifyPhoneForm />
    </AuthLayout>
  );
}
