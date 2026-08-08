import "server-only";

import { getTranslations } from "next-intl/server";
import { Resend } from "resend";

import type { AppLocale } from "@/i18n/routing";

let resendClient: Resend | undefined;

type EmailEnvironmentVariable = "RESEND_API_KEY" | "EMAIL_FROM" | "APP_URL";

export type SendEmailVerificationEmailParams = {
  to: string;
  verificationToken: string;
  locale: AppLocale;
};

export type SendPasswordResetEmailParams = {
  to: string;
  resetToken: string;
  locale: AppLocale;
};

export type SentEmail = {
  id: string;
};

function getRequiredEnvironmentVariable(
  name: EmailEnvironmentVariable,
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

function getResend(): Resend {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = getRequiredEnvironmentVariable("RESEND_API_KEY");

  resendClient = new Resend(apiKey);

  return resendClient;
}

function createEmailVerificationUrl(
  verificationToken: string,
  locale: AppLocale,
): string {
  const appUrl = getRequiredEnvironmentVariable("APP_URL");

  const verificationUrl = new URL(`/${locale}/verify-email`, appUrl);

  verificationUrl.searchParams.set("token", verificationToken);

  return verificationUrl.toString();
}

function createPasswordResetUrl(
  resetToken: string,
  locale: AppLocale,
): string {
  const appUrl = getRequiredEnvironmentVariable("APP_URL");
  const resetUrl = new URL(`/${locale}/reset-password`, appUrl);

  resetUrl.searchParams.set("token", resetToken);

  return resetUrl.toString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmailVerificationEmail({
  to,
  verificationToken,
  locale,
}: SendEmailVerificationEmailParams): Promise<SentEmail> {
  const t = await getTranslations({
    locale,
    namespace: "emails.verifyEmail",
  });

  const resend = getResend();
  const from = getRequiredEnvironmentVariable("EMAIL_FROM");

  const verificationUrl = createEmailVerificationUrl(
    verificationToken,
    locale,
  );

  const escapedVerificationUrl = escapeHtml(verificationUrl);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: t("subject"),

    text: [
      t("welcome"),
      "",
      t("linkInstruction"),
      verificationUrl,
      "",
      t("expires"),
      "",
      t("ignore"),
    ].join("\n"),

    html: `
      <!doctype html>
      <html lang="${locale}">
        <body
          style="
            margin: 0;
            padding: 0;
            background: #f5f5f5;
            font-family: Arial, sans-serif;
            color: #1f2937;
          "
        >
          <div style="padding: 32px 16px;">
            <div
              style="
                max-width: 560px;
                margin: 0 auto;
                padding: 32px;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                background: #ffffff;
              "
            >
              <h1
                style="
                  margin: 0 0 16px;
                  font-size: 26px;
                  line-height: 1.25;
                "
              >
                ${t("heading")}
              </h1>

              <p
                style="
                  margin: 0 0 24px;
                  font-size: 16px;
                  line-height: 1.6;
                  color: #4b5563;
                "
              >
                ${t("description")}
              </p>

              <a
                href="${escapedVerificationUrl}"
                style="
                  display: inline-block;
                  padding: 12px 20px;
                  border-radius: 8px;
                  background: #111827;
                  color: #ffffff;
                  font-size: 16px;
                  font-weight: 600;
                  text-decoration: none;
                "
              >
                ${t("action")}
              </a>

              <p
                style="
                  margin: 24px 0 0;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #6b7280;
                "
              >
                ${t("expires")}
              </p>

              <p
                style="
                  margin: 16px 0 0;
                  font-size: 12px;
                  line-height: 1.6;
                  color: #9ca3af;
                  word-break: break-all;
                "
              >
                ${escapedVerificationUrl}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Email delivery did not return an email ID");
  }

  return {
    id: data.id,
  };
}

export async function sendPasswordResetEmail({
  to,
  resetToken,
  locale,
}: SendPasswordResetEmailParams): Promise<SentEmail> {
  const t = await getTranslations({
    locale,
    namespace: "emails.passwordReset",
  });

  const resend = getResend();
  const from = getRequiredEnvironmentVariable("EMAIL_FROM");
  const resetUrl = createPasswordResetUrl(resetToken, locale);
  const escapedResetUrl = escapeHtml(resetUrl);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: t("subject"),

    text: [
      t("heading"),
      "",
      t("description"),
      "",
      t("linkInstruction"),
      resetUrl,
      "",
      t("expires"),
      "",
      t("ignore"),
    ].join("\n"),

    html: `
      <!doctype html>
      <html lang="${locale}">
        <body
          style="
            margin: 0;
            padding: 0;
            background: #f5f5f5;
            font-family: Arial, sans-serif;
            color: #1f2937;
          "
        >
          <div style="padding: 32px 16px;">
            <div
              style="
                max-width: 560px;
                margin: 0 auto;
                padding: 32px;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                background: #ffffff;
              "
            >
              <h1
                style="
                  margin: 0 0 16px;
                  font-size: 26px;
                  line-height: 1.25;
                "
              >
                ${t("heading")}
              </h1>

              <p
                style="
                  margin: 0 0 24px;
                  font-size: 16px;
                  line-height: 1.6;
                  color: #4b5563;
                "
              >
                ${t("description")}
              </p>

              <a
                href="${escapedResetUrl}"
                style="
                  display: inline-block;
                  padding: 12px 20px;
                  border-radius: 8px;
                  background: #111827;
                  color: #ffffff;
                  font-size: 16px;
                  font-weight: 600;
                  text-decoration: none;
                "
              >
                ${t("action")}
              </a>

              <p
                style="
                  margin: 24px 0 0;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #6b7280;
                "
              >
                ${t("expires")}
              </p>

              <p
                style="
                  margin: 16px 0 0;
                  font-size: 12px;
                  line-height: 1.6;
                  color: #9ca3af;
                  word-break: break-all;
                "
              >
                ${escapedResetUrl}
              </p>

              <p
                style="
                  margin: 16px 0 0;
                  font-size: 12px;
                  line-height: 1.6;
                  color: #9ca3af;
                "
              >
                ${t("ignore")}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Email delivery did not return an email ID");
  }

  return {
    id: data.id,
  };
}
