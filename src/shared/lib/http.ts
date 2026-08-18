import "server-only";

import { NextResponse } from "next/server";

export const MAX_AUTH_JSON_BODY_BYTES = 4 * 1_024;

export type LimitedJsonBodyResult =
  | {
      ok: true;
      body: Record<string, unknown>;
    }
  | {
      ok: false;
      code: "INVALID_JSON" | "PAYLOAD_TOO_LARGE";
    };

export function createNoStoreJsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers?: HeadersInit,
): NextResponse {
  const response = NextResponse.json(body, {
    status,
    headers,
  });

  response.headers.set("Cache-Control", "no-store");

  return response;
}

export function isJsonRequest(request: Request): boolean {
  return (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() === "application/json"
  );
}

function getHttpOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
}

export function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  const requestOrigin = getHttpOrigin(origin);

  if (!requestOrigin) {
    return false;
  }

  const trustedOrigins = new Set<string>();
  const configuredAppUrl = process.env.APP_URL?.trim();

  if (configuredAppUrl) {
    const configuredAppOrigin = getHttpOrigin(configuredAppUrl);

    if (!configuredAppOrigin) {
      return false;
    }

    trustedOrigins.add(configuredAppOrigin);
  } else if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    const urlOrigin = getHttpOrigin(request.url);

    if (urlOrigin) {
      trustedOrigins.add(urlOrigin);
    }
  }

  if (process.env.VERCEL === "1") {
    const vercelUrl = process.env.VERCEL_URL?.trim();

    if (vercelUrl) {
      const vercelOrigin = getHttpOrigin(`https://${vercelUrl}`);

      if (vercelOrigin) {
        trustedOrigins.add(vercelOrigin);
      }
    }
  }

  return trustedOrigins.has(requestOrigin);
}

export async function readLimitedJsonBody(
  request: Request,
  maxBytes = MAX_AUTH_JSON_BODY_BYTES,
): Promise<LimitedJsonBodyResult> {
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredBodyLength = Number(contentLength);

    if (
      Number.isFinite(declaredBodyLength) &&
      declaredBodyLength >= 0 &&
      declaredBodyLength > maxBytes
    ) {
      return {
        ok: false,
        code: "PAYLOAD_TOO_LARGE",
      };
    }
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  try {
    reader = request.body?.getReader();
  } catch {
    return {
      ok: false,
      code: "INVALID_JSON",
    };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        totalBytes += value.byteLength;

        if (totalBytes > maxBytes) {
          try {
            await reader.cancel();
          } catch {
            // The response remains deterministic even if stream cancellation fails.
          }

          return {
            ok: false,
            code: "PAYLOAD_TOO_LARGE",
          };
        }

        chunks.push(value);
      }
    } catch {
      return {
        ok: false,
        code: "INVALID_JSON",
      };
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // A malformed stream still maps to a deterministic JSON error.
      }
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const body: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return {
        ok: false,
        code: "INVALID_JSON",
      };
    }

    return {
      ok: true,
      body: body as Record<string, unknown>,
    };
  } catch {
    return {
      ok: false,
      code: "INVALID_JSON",
    };
  }
}
