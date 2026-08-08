import { SignUpFormContainer } from "@/features/auth/sign-up";
import { AuthLayout } from "@/widgets/AuthLayout";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUpFormContainer />
    </AuthLayout>
  );
}
