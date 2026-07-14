import { SignUpForm } from "@/features/auth/sign-up";
import { AuthLayout } from "@/widgets/AuthLayout";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
