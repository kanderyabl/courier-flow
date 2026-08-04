import type { VerifyEmailResult } from "../types";

function getResponseCode(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("code" in body)) {
    return undefined;
  }

  const code = body.code;

  return typeof code === "string" ? code : undefined;
}

export async function verifyEmail(
  token: string,
  signal: AbortSignal,
): Promise<VerifyEmailResult> {
  const response = await fetch("/api/auth/verify-email", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      token,
    }),

    signal,
  });

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // Сервер вернул ответ без JSON.
  }

  const code = getResponseCode(body);

  if (
    response.ok &&
    (code === "EMAIL_VERIFIED" || code === "EMAIL_ALREADY_VERIFIED")
  ) {
    return "success";
  }

  if (response.status === 410 && code === "VERIFICATION_TOKEN_EXPIRED") {
    return "expired";
  }

  if (
    response.status === 400 &&
    (code === "VERIFICATION_TOKEN_INVALID" || code === "VALIDATION_ERROR")
  ) {
    return "invalid";
  }

  return "error";
}
