import { SignInForm } from "@/features/auth/sign-in";
import { AuthLayout } from "@/widgets/AuthLayout";

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
