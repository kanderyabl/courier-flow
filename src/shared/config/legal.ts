import "server-only";

export const LEGAL_PUBLICATION_FIELD_KEYS = [
  "operatorName",
  "operatorRegistration",
  "operatorAddress",
  "contactEmail",
  "effectiveDate",
  "jurisdiction",
] as const;

export type LegalPublicationFieldKey =
  (typeof LEGAL_PUBLICATION_FIELD_KEYS)[number];

export type LegalPublicationDetails = {
  values: Record<LegalPublicationFieldKey, string | null>;
  missingFields: LegalPublicationFieldKey[];
  documentsReviewed: boolean;
  isReadyForPublication: boolean;
};

function readOptionalEnvironmentVariable(name: string): string | null {
  const value = process.env[name]?.trim();

  return value ? value : null;
}

export function getLegalPublicationDetails(): LegalPublicationDetails {
  const values = {
    operatorName: readOptionalEnvironmentVariable("LEGAL_OPERATOR_NAME"),
    operatorRegistration: readOptionalEnvironmentVariable(
      "LEGAL_OPERATOR_REGISTRATION",
    ),
    operatorAddress: readOptionalEnvironmentVariable("LEGAL_OPERATOR_ADDRESS"),
    contactEmail: readOptionalEnvironmentVariable("LEGAL_CONTACT_EMAIL"),
    effectiveDate: readOptionalEnvironmentVariable("LEGAL_EFFECTIVE_DATE"),
    jurisdiction: readOptionalEnvironmentVariable("LEGAL_JURISDICTION"),
  } satisfies Record<LegalPublicationFieldKey, string | null>;

  const missingFields = LEGAL_PUBLICATION_FIELD_KEYS.filter(
    (field) => values[field] === null,
  );
  const documentsReviewed =
    readOptionalEnvironmentVariable("LEGAL_DOCUMENTS_REVIEWED") === "true";

  return {
    values,
    missingFields,
    documentsReviewed,
    isReadyForPublication: documentsReviewed && missingFields.length === 0,
  };
}
