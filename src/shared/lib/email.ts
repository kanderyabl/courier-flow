import "server-only";

import { Resend } from "resend";

let resendClient: Resend | undefined;

type EmailEnvironmentVariable = "RESEND_API_KEY" | "EMAIL_FROM" | "APP_URL";

export type SendEmailVerificationEmailParams = {
  to: string;
  verificationToken: string;
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

function createEmailVerificationUrl(verificationToken: string): string {
  const appUrl = getRequiredEnvironmentVariable("APP_URL");

  const verificationUrl = new URL("/en/verify-email", appUrl);

  verificationUrl.searchParams.set("token", verificationToken);

  return verificationUrl.toString();
}

export async function sendEmailVerificationEmail({
  to,
  verificationToken,
}: SendEmailVerificationEmailParams): Promise<SentEmail> {
  const resend = getResend();
  const from = getRequiredEnvironmentVariable("EMAIL_FROM");

  const verificationUrl = createEmailVerificationUrl(verificationToken);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: "Verify your Courier Flow email",

    text: [
      "Welcome to Courier Flow!",
      "",
      "Confirm your email address by opening this link:",
      verificationUrl,
      "",
      "This verification link expires in 24 hours.",
      "",
      "If you did not create this account, ignore this email.",
    ].join("\n"),

    html: `
      <!doctype html>
      <html lang="en">
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
                Verify your email
              </h1>

              <p
                style="
                  margin: 0 0 24px;
                  font-size: 16px;
                  line-height: 1.6;
                  color: #4b5563;
                "
              >
                Confirm your email address to finish setting up
                your Courier Flow account.
              </p>

              <a
                href="${verificationUrl}"
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
                Verify email
              </a>

              <p
                style="
                  margin: 24px 0 0;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #6b7280;
                "
              >
                This link expires in 24 hours.
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
                ${verificationUrl}
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
