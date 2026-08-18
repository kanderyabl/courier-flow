import { redirect } from "next/navigation";

type VerifyPhonePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function VerifyPhonePage({
  params,
}: VerifyPhonePageProps) {
  const { locale } = await params;

  redirect(`/${locale}`);
}
