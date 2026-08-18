import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getLegalPublicationDetails } from "@/shared/config/legal";

import { LegalDocument, type LegalSection } from "../_components/LegalDocument";

type PrivacyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  const publication = getLegalPublicationDetails();

  return {
    title: t("metaTitle"),
    description: t("summary"),
    robots: {
      index: publication.isReadyForPublication,
      follow: publication.isReadyForPublication,
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const [t, shared] = await Promise.all([
    getTranslations({ locale, namespace: "legal.privacy" }),
    getTranslations({ locale, namespace: "legal.shared" }),
  ]);

  const sections: LegalSection[] = [
    {
      title: t("sections.scope.title"),
      paragraphs: [t("sections.scope.body")],
    },
    {
      title: t("sections.data.title"),
      paragraphs: [t("sections.data.body")],
      items: [
        t("sections.data.items.account"),
        t("sections.data.items.security"),
        t("sections.data.items.delivery"),
      ],
    },
    {
      title: t("sections.use.title"),
      paragraphs: [t("sections.use.body")],
    },
    {
      title: t("sections.legalBases.title"),
      paragraphs: [t("sections.legalBases.body")],
    },
    {
      title: t("sections.recipients.title"),
      paragraphs: [t("sections.recipients.body")],
    },
    {
      title: t("sections.internationalTransfers.title"),
      paragraphs: [t("sections.internationalTransfers.body")],
    },
    {
      title: t("sections.retention.title"),
      paragraphs: [t("sections.retention.body")],
    },
    {
      title: t("sections.security.title"),
      paragraphs: [t("sections.security.body")],
    },
    {
      title: t("sections.cookies.title"),
      paragraphs: [t("sections.cookies.body")],
    },
    {
      title: t("sections.rights.title"),
      paragraphs: [t("sections.rights.body")],
    },
    {
      title: t("sections.complaints.title"),
      paragraphs: [t("sections.complaints.body")],
    },
  ];
  const publication = getLegalPublicationDetails();

  return (
    <LegalDocument
      title={t("title")}
      summary={t("summary")}
      draftTitle={shared("draft.title")}
      draftDescription={shared("draft.description")}
      publicationTitle={shared("publication.title")}
      publicationDescription={shared("publication.description")}
      publicationLabels={{
        operatorName: shared("publication.fields.operatorName"),
        operatorRegistration: shared(
          "publication.fields.operatorRegistration",
        ),
        operatorAddress: shared("publication.fields.operatorAddress"),
        contactEmail: shared("publication.fields.contactEmail"),
        effectiveDate: shared("publication.fields.effectiveDate"),
        jurisdiction: shared("publication.fields.jurisdiction"),
      }}
      missingValue={shared("publication.missingValue")}
      publication={publication}
      sections={sections}
      backHref={`/${locale}/sign-up`}
      backLabel={shared("actions.backToSignUp")}
      alternateDocumentHref={`/${locale}/terms`}
      alternateDocumentLabel={shared("actions.viewTerms")}
    />
  );
}
