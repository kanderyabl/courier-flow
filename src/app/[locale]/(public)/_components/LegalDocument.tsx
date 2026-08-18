import Link from "next/link";

import { Container } from "@/components/Container";
import {
  LEGAL_PUBLICATION_FIELD_KEYS,
  type LegalPublicationDetails,
  type LegalPublicationFieldKey,
} from "@/shared/config/legal";

import styles from "./LegalDocument.module.css";

export type LegalSection = {
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
};

type LegalDocumentProps = {
  title: string;
  summary: string;
  draftTitle: string;
  draftDescription: string;
  publicationTitle: string;
  publicationDescription: string;
  publicationLabels: Record<LegalPublicationFieldKey, string>;
  missingValue: string;
  publication: LegalPublicationDetails;
  sections: readonly LegalSection[];
  backHref: string;
  backLabel: string;
  alternateDocumentHref: string;
  alternateDocumentLabel: string;
};

export function LegalDocument({
  title,
  summary,
  draftTitle,
  draftDescription,
  publicationTitle,
  publicationDescription,
  publicationLabels,
  missingValue,
  publication,
  sections,
  backHref,
  backLabel,
  alternateDocumentHref,
  alternateDocumentLabel,
}: LegalDocumentProps) {
  return (
    <main className={styles.page}>
      <Container size="md" className={styles.container}>
        <header className={styles.header}>
          <p className={styles.brand}>Courier Flow</p>
          <h1>{title}</h1>
          <p className={styles.summary}>{summary}</p>
        </header>

        {!publication.isReadyForPublication && (
          <aside className={styles.draftNotice} aria-labelledby="draft-title">
            <h2 id="draft-title">{draftTitle}</h2>
            <p>{draftDescription}</p>
          </aside>
        )}

        <section
          className={styles.publication}
          aria-labelledby="publication-title"
        >
          <div className={styles.sectionHeading}>
            <h2 id="publication-title">{publicationTitle}</h2>
            <p>{publicationDescription}</p>
          </div>

          <dl className={styles.details}>
            {LEGAL_PUBLICATION_FIELD_KEYS.map((field) => {
              const value = publication.values[field];

              return (
                <div className={styles.detail} key={field}>
                  <dt>{publicationLabels[field]}</dt>
                  <dd className={value === null ? styles.missing : undefined}>
                    {value ?? missingValue}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <article className={styles.document}>
          {sections.map((section) => (
            <section className={styles.section} key={section.title}>
              <h2>{section.title}</h2>

              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              {section.items && (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <nav className={styles.navigation} aria-label={title}>
          <Link href={backHref}>{backLabel}</Link>
          <Link href={alternateDocumentHref}>{alternateDocumentLabel}</Link>
        </nav>
      </Container>
    </main>
  );
}
