import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getLegalPublicationDetails } from "@/shared/config/legal";

import { LegalDocument, type LegalSection } from "../_components/LegalDocument";

type TermsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });
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

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const [t, shared] = await Promise.all([
    getTranslations({ locale, namespace: "legal.terms" }),
    getTranslations({ locale, namespace: "legal.shared" }),
  ]);

  const sections: LegalSection[] = [
    {
      title: t("sections.currentService.title"),
      paragraphs: [t("sections.currentService.body")],
    },
    {
      title: t("sections.accounts.title"),
      paragraphs: [t("sections.accounts.body")],
    },
    {
      title: t("sections.acceptableUse.title"),
      paragraphs: [t("sections.acceptableUse.body")],
    },
    {
      title: t("sections.deliveries.title"),
      paragraphs: [t("sections.deliveries.body")],
    },
    {
      title: t("sections.pricing.title"),
      paragraphs: [t("sections.pricing.body")],
    },
    {
      title: t("sections.cancellation.title"),
      paragraphs: [t("sections.cancellation.body")],
    },
    {
      title: t("sections.liability.title"),
      paragraphs: [t("sections.liability.body")],
    },
    {
      title: t("sections.availability.title"),
      paragraphs: [t("sections.availability.body")],
    },
    {
      title: t("sections.changes.title"),
      paragraphs: [t("sections.changes.body")],
    },
    {
      title: t("sections.completion.title"),
      paragraphs: [t("sections.completion.body")],
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
      alternateDocumentHref={`/${locale}/privacy`}
      alternateDocumentLabel={shared("actions.viewPrivacy")}
    />
  );
}
