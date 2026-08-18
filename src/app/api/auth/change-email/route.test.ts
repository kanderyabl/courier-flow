import type { NextRequest } from "next/server";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(code: string) {
      super(code);
      this.code = code;
    }
  }

  return {
    PrismaClientKnownRequestError,
    createAuthToken: vi.fn(),
    getCurrentSession: vi.fn(),
    getPrisma: vi.fn(),
    sendEmailVerificationEmail: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@/generated/prisma/client", () => ({
  AuthChallengeType: {
    EMAIL_CHANGE: "EMAIL_CHANGE",
    EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  },
  Prisma: {
    PrismaClientKnownRequestError: mocks.PrismaClientKnownRequestError,
  },
}));

vi.mock("@/i18n/routing", () => ({
  isAppLocale: (value: string) => value === "en",
  routing: {
    defaultLocale: "en",
  },
}));

vi.mock("@/shared/lib/authToken", () => ({
  createAuthToken: mocks.createAuthToken,
}));

vi.mock("@/shared/lib/email", () => ({
  sendEmailVerificationEmail: mocks.sendEmailVerificationEmail,
}));

vi.mock("@/shared/lib/prisma", () => ({
  getPrisma: mocks.getPrisma,
}));

vi.mock("@/shared/lib/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

import { POST } from "./route";

const CHANGE_EMAIL_URL =
  "https://courier-flow.example/api/auth/change-email";
const TRUSTED_ORIGIN = new URL(CHANGE_EMAIL_URL).origin;

type CreateRequestOptions = {
  body?: BodyInit;
  contentType?: string | null;
  headers?: HeadersInit;
  origin?: string | null;
};

function createRequest({
  body = JSON.stringify({ email: "new@example.com", locale: "en" }),
  contentType = "application/json",
  headers,
  origin = TRUSTED_ORIGIN,
}: CreateRequestOptions = {}): NextRequest {
  const requestHeaders = new Headers(headers);

  if (origin !== null) {
    requestHeaders.set("Origin", origin);
  }

  if (contentType !== null) {
    requestHeaders.set("Content-Type", contentType);
  }

  return new Request(CHANGE_EMAIL_URL, {
    method: "POST",
    headers: requestHeaders,
    body,
  }) as NextRequest;
}

function expectNoBusinessWork(): void {
  expect(mocks.getCurrentSession).not.toHaveBeenCalled();
  expect(mocks.getPrisma).not.toHaveBeenCalled();
  expect(mocks.createAuthToken).not.toHaveBeenCalled();
  expect(mocks.sendEmailVerificationEmail).not.toHaveBeenCalled();
}

describe("POST /api/auth/change-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mocks.getCurrentSession.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an untrusted origin before session or database work", async () => {
    const response = await POST(
      createRequest({ origin: "https://attacker.example" }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_ORIGIN" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expectNoBusinessWork();
  });

  it("requires an application/json content type", async () => {
    const response = await POST(createRequest({ contentType: "text/plain" }));

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expectNoBusinessWork();
  });

  it("limits actual streamed bytes when Content-Length is understated", async () => {
    const response = await POST(
      createRequest({
        body: JSON.stringify({ email: `${"x".repeat(4 * 1_024)}@example.com` }),
        headers: {
          "Content-Length": "1",
        },
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      code: "PAYLOAD_TOO_LARGE",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expectNoBusinessWork();
  });

  it("returns no-store for malformed JSON", async () => {
    const response = await POST(createRequest({ body: "{" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_JSON" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expectNoBusinessWork();
  });

  it("preserves the unauthorized state response after parsing", async () => {
    const request = createRequest();
    const response = await POST(request);

    expect(mocks.getCurrentSession).toHaveBeenCalledWith(request);
    expect(mocks.getPrisma).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: "UNAUTHORIZED" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
