import "server-only";

import { NextResponse } from "next/server";

export type LimitedJsonBodyResult =
  | {
      ok: true;
      body: unknown;
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

export function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    const trustedOrigins = new Set([new URL(request.url).origin]);
    const configuredAppUrl = process.env.APP_URL?.trim();

    if (configuredAppUrl) {
      trustedOrigins.add(new URL(configuredAppUrl).origin);
    }

    return trustedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export async function readLimitedJsonBody(
  request: Request,
  maxBytes: number,
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

  const reader = request.body?.getReader();
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
    } finally {
      reader.releaseLock();
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    };
  } catch {
    return {
      ok: false,
      code: "INVALID_JSON",
    };
  }
}
