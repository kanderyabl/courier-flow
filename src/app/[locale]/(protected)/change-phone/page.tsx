import { redirect } from "next/navigation";

type ChangePhonePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function ChangePhonePage({
  params,
}: ChangePhonePageProps) {
  const { locale } = await params;

  redirect(`/${locale}`);
}
