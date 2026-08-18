import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getRequestUserAgent, resolveRequestIp } from "./request";

const REQUEST_URL = "https://courier-flow.example/api/auth/test";

function createRequest(headers?: HeadersInit): Request {
  return new Request(REQUEST_URL, { headers });
}

describe("request metadata security helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows a missing client IP without a shared fallback bucket in test", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUSTED_PROXY_HEADER", "");

    expect(resolveRequestIp(createRequest())).toEqual({
      ok: false,
      failClosed: false,
      reason: "CLIENT_IP_MISSING_OR_INVALID",
    });
  });

  it("uses the first forwarded address outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUSTED_PROXY_HEADER", "");

    expect(
      resolveRequestIp(
        createRequest({
          "X-Forwarded-For": "203.0.113.10, 10.0.0.1",
        }),
      ),
    ).toEqual({ ok: true, ipAddress: "203.0.113.10" });
  });

  it("trusts only the Vercel header on Vercel production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TRUSTED_PROXY_HEADER", "x-forwarded-for");

    expect(
      resolveRequestIp(
        createRequest({
          "X-Forwarded-For": "198.51.100.200",
          "X-Real-Ip": "198.51.100.201",
          "X-Vercel-Forwarded-For": "203.0.113.20, 10.0.0.2",
        }),
      ),
    ).toEqual({ ok: true, ipAddress: "203.0.113.20" });
  });

  it("does not fall back to spoofable headers when the Vercel header is absent", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TRUSTED_PROXY_HEADER", "");

    expect(
      resolveRequestIp(
        createRequest({
          "X-Forwarded-For": "198.51.100.200",
          "X-Real-Ip": "198.51.100.201",
        }),
      ),
    ).toEqual({
      ok: false,
      failClosed: true,
      reason: "CLIENT_IP_MISSING_OR_INVALID",
    });
  });

  it("fails closed in self-hosted production without an explicit proxy header", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUSTED_PROXY_HEADER", "");

    expect(
      resolveRequestIp(
        createRequest({ "X-Forwarded-For": "198.51.100.200" }),
      ),
    ).toEqual({
      ok: false,
      failClosed: true,
      reason: "TRUSTED_PROXY_NOT_CONFIGURED",
    });
  });

  it("normalizes and allow-lists an explicitly trusted proxy header", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUSTED_PROXY_HEADER", " X-Real-IP ");

    expect(
      resolveRequestIp(
        createRequest({
          "X-Forwarded-For": "198.51.100.200",
          "X-Real-IP": "2001:db8::1",
        }),
      ),
    ).toEqual({ ok: true, ipAddress: "2001:db8::1" });
  });

  it("fails closed for an unsupported proxy header configuration", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUSTED_PROXY_HEADER", "cf-connecting-ip");

    expect(resolveRequestIp(createRequest())).toEqual({
      ok: false,
      failClosed: true,
      reason: "TRUSTED_PROXY_HEADER_INVALID",
    });
  });

  it("rejects malformed IP values", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUSTED_PROXY_HEADER", "x-forwarded-for");

    expect(
      resolveRequestIp(
        createRequest({ "X-Forwarded-For": "203.0.113.10:443" }),
      ),
    ).toEqual({
      ok: false,
      failClosed: true,
      reason: "CLIENT_IP_MISSING_OR_INVALID",
    });
  });

  it("trims and bounds the stored user agent", () => {
    expect(
      getRequestUserAgent(
        createRequest({ "User-Agent": `  ${"x".repeat(2_000)}  ` }),
      ),
    ).toBe("x".repeat(1_024));
    expect(getRequestUserAgent(createRequest())).toBeUndefined();
  });
});
