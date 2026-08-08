import { ForgotPasswordFormContainer } from "@/features/auth/forgot-password";
import { AuthLayout } from "@/widgets/AuthLayout";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordFormContainer />
    </AuthLayout>
  );
}
