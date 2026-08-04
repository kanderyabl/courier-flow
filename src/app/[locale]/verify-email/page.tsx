import {
  VerifyEmailCard,
  VerifyEmailResultCard,
} from "@/features/auth/verify-email";
import { AuthLayout } from "@/widgets/AuthLayout";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;

  const verificationToken = Array.isArray(token) ? token[0] : token;

  return (
    <AuthLayout>
      {verificationToken !== undefined ? (
        <VerifyEmailResultCard token={verificationToken} />
      ) : (
        <VerifyEmailCard />
      )}
    </AuthLayout>
  );
}
