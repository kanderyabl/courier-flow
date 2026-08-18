import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createNoStoreJsonResponse,
  isJsonRequest,
  isTrustedOrigin,
  MAX_AUTH_JSON_BODY_BYTES,
  readLimitedJsonBody,
} from "./http";

const REQUEST_URL = "https://courier-flow.example/api/auth/test";

function createJsonRequest(
  body: BodyInit,
  headers?: HeadersInit,
): Request {
  return new Request(REQUEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });
}

describe("shared HTTP security helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses a 4 KiB default JSON body limit", () => {
    expect(MAX_AUTH_JSON_BODY_BYTES).toBe(4 * 1_024);
  });

  it("accepts application/json case-insensitively with parameters", () => {
    const request = createJsonRequest("{}", {
      "Content-Type": "Application/JSON ; charset=utf-8",
    });

    expect(isJsonRequest(request)).toBe(true);
  });

  it("rejects non-JSON media types", () => {
    const request = createJsonRequest("{}", {
      "Content-Type": "application/problem+json",
    });

    expect(isJsonRequest(request)).toBe(false);
  });

  it("accepts the request origin and a configured application origin", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("APP_URL", "https://app.courier-flow.example/base/path");

    const requestOrigin = new Request(REQUEST_URL, {
      headers: { Origin: "https://courier-flow.example" },
    });
    const configuredOrigin = new Request(REQUEST_URL, {
      headers: { Origin: "https://app.courier-flow.example" },
    });

    expect(isTrustedOrigin(requestOrigin)).toBe(true);
    expect(isTrustedOrigin(configuredOrigin)).toBe(true);
  });

  it("rejects missing, malformed, and untrusted origins", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("APP_URL", "");

    expect(isTrustedOrigin(new Request(REQUEST_URL))).toBe(false);
    expect(
      isTrustedOrigin(
        new Request(REQUEST_URL, { headers: { Origin: "not a URL" } }),
      ),
    ).toBe(false);
    expect(
      isTrustedOrigin(
        new Request(REQUEST_URL, {
          headers: { Origin: "https://attacker.example" },
        }),
      ),
    ).toBe(false);
  });

  it("requires APP_URL as the authoritative origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("APP_URL", "");

    const request = new Request(REQUEST_URL, {
      headers: { Origin: "https://courier-flow.example" },
    });

    expect(isTrustedOrigin(request)).toBe(false);

    vi.stubEnv("APP_URL", "not a URL");
    expect(isTrustedOrigin(request)).toBe(false);
  });

  it("does not trust the request URL origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("APP_URL", "https://app.courier-flow.example");

    const untrustedHostRequest = new Request(REQUEST_URL, {
      headers: { Origin: "https://courier-flow.example" },
    });
    const configuredOriginRequest = new Request(REQUEST_URL, {
      headers: { Origin: "https://app.courier-flow.example" },
    });

    expect(isTrustedOrigin(untrustedHostRequest)).toBe(false);
    expect(isTrustedOrigin(configuredOriginRequest)).toBe(true);
  });

  it("allows the platform-provided Vercel deployment origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_URL", "courier-flow-preview.vercel.app");
    vi.stubEnv("APP_URL", "https://courier-flow.example");

    const request = new Request(REQUEST_URL, {
      headers: { Origin: "https://courier-flow-preview.vercel.app" },
    });

    expect(isTrustedOrigin(request)).toBe(true);
  });

  it("creates JSON responses that cannot be stored", async () => {
    const response = createNoStoreJsonResponse(
      { code: "RATE_LIMITED" },
      429,
      { "Retry-After": "60" },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Retry-After")).toBe("60");
    await expect(response.json()).resolves.toEqual({ code: "RATE_LIMITED" });
  });

  it("reads a JSON object at the exact byte limit", async () => {
    const body = `{"value":"${"x".repeat(
      MAX_AUTH_JSON_BODY_BYTES - 12,
    )}"}`;

    expect(new TextEncoder().encode(body)).toHaveLength(
      MAX_AUTH_JSON_BODY_BYTES,
    );
    await expect(readLimitedJsonBody(createJsonRequest(body))).resolves.toEqual(
      {
        ok: true,
        body: { value: "x".repeat(MAX_AUTH_JSON_BODY_BYTES - 12) },
      },
    );
  });

  it("rejects actual streamed bytes above the limit despite an understated length", async () => {
    const body = `{"value":"${"x".repeat(MAX_AUTH_JSON_BODY_BYTES)}"}`;
    const result = await readLimitedJsonBody(
      createJsonRequest(body, { "Content-Length": "1" }),
    );

    expect(result).toEqual({ ok: false, code: "PAYLOAD_TOO_LARGE" });
  });

  it("fast-rejects an oversized declared length", async () => {
    const result = await readLimitedJsonBody(
      createJsonRequest("{}", {
        "Content-Length": String(MAX_AUTH_JSON_BODY_BYTES + 1),
      }),
    );

    expect(result).toEqual({ ok: false, code: "PAYLOAD_TOO_LARGE" });
  });

  it("rejects malformed JSON and invalid UTF-8", async () => {
    await expect(
      readLimitedJsonBody(createJsonRequest("{")),
    ).resolves.toEqual({ ok: false, code: "INVALID_JSON" });

    await expect(
      readLimitedJsonBody(
        createJsonRequest(new Uint8Array([0x7b, 0x22, 0xc3, 0x28, 0x22, 0x7d])),
      ),
    ).resolves.toEqual({ ok: false, code: "INVALID_JSON" });
  });

  it("maps an unavailable request stream to a deterministic JSON error", async () => {
    const request = createJsonRequest("{}");
    const reader = request.body?.getReader();

    await expect(readLimitedJsonBody(request)).resolves.toEqual({
      ok: false,
      code: "INVALID_JSON",
    });

    reader?.releaseLock();
  });

  it.each(["null", "[]", '"value"', "true", "1"])(
    "rejects a non-object JSON document: %s",
    async (body) => {
      await expect(
        readLimitedJsonBody(createJsonRequest(body)),
      ).resolves.toEqual({ ok: false, code: "INVALID_JSON" });
    },
  );
});
