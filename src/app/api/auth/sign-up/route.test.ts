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
    consumeAuthRateLimits: vi.fn(),
    createAuthToken: vi.fn(),
    createSessionToken: vi.fn(),
    findFirstUser: vi.fn(),
    createUser: vi.fn(),
    getPrisma: vi.fn(),
    resolveRequestIp: vi.fn(),
    getRequestUserAgent: vi.fn(),
    hashPassword: vi.fn(),
    sendEmailVerificationEmail: vi.fn(),
    setSessionCookie: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@/generated/prisma/client", () => ({
  AuthChallengeType: {
    EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  },
  Prisma: {
    PrismaClientKnownRequestError: mocks.PrismaClientKnownRequestError,
  },
  UserRole: {
    CLIENT: "CLIENT",
  },
}));

vi.mock("@/i18n/routing", () => ({
  isAppLocale: (value: string) => ["en", "uk", "es", "fr", "zh", "hi"].includes(value),
  routing: {
    defaultLocale: "en",
  },
}));

vi.mock("@/shared/lib/authRateLimit", () => ({
  consumeAuthRateLimits: mocks.consumeAuthRateLimits,
}));

vi.mock("@/shared/lib/authToken", () => ({
  createAuthToken: mocks.createAuthToken,
}));

vi.mock("@/shared/lib/email", () => ({
  sendEmailVerificationEmail: mocks.sendEmailVerificationEmail,
}));

vi.mock("@/shared/lib/password", () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock("@/shared/lib/prisma", () => ({
  getPrisma: mocks.getPrisma,
}));

vi.mock("@/shared/lib/request", () => ({
  getRequestUserAgent: mocks.getRequestUserAgent,
  resolveRequestIp: mocks.resolveRequestIp,
}));

vi.mock("@/shared/lib/session", () => ({
  createSessionToken: mocks.createSessionToken,
  setSessionCookie: mocks.setSessionCookie,
}));

import { POST } from "./route";

const SIGN_UP_URL = "https://courier-flow.example/api/auth/sign-up";
const TRUSTED_ORIGIN = new URL(SIGN_UP_URL).origin;

const validBody = {
  role: "client",
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+48123456789",
  password: "Strong!Password1",
  confirmPassword: "Strong!Password1",
  acceptTerms: true,
  locale: "en",
};

const createdUser = {
  id: "user-id",
  name: validBody.name,
  email: validBody.email,
  phone: validBody.phone,
  role: "CLIENT",
  emailVerifiedAt: null,
  createdAt: new Date("2026-08-18T00:00:00.000Z"),
};

type CreateRequestOptions = {
  body?: string;
  contentType?: string | null;
  headers?: HeadersInit;
  origin?: string | null;
};

function createRequest({
  body = JSON.stringify(validBody),
  contentType = "application/json",
  headers,
  origin = TRUSTED_ORIGIN,
}: CreateRequestOptions = {}): Request {
  const requestHeaders = new Headers(headers);

  if (origin !== null) {
    requestHeaders.set("Origin", origin);
  }

  if (contentType !== null) {
    requestHeaders.set("Content-Type", contentType);
  }

  return new Request(SIGN_UP_URL, {
    method: "POST",
    headers: requestHeaders,
    body,
  });
}

function expectNoBusinessWork(): void {
  expect(mocks.getPrisma).not.toHaveBeenCalled();
  expect(mocks.hashPassword).not.toHaveBeenCalled();
  expect(mocks.createUser).not.toHaveBeenCalled();
  expect(mocks.sendEmailVerificationEmail).not.toHaveBeenCalled();
}

describe("POST /api/auth/sign-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    mocks.consumeAuthRateLimits.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.createAuthToken.mockReturnValue({
      token: "verification-token",
      tokenHash: "verification-token-hash",
    });
    mocks.createSessionToken.mockReturnValue({
      token: "session-token",
      tokenHash: "session-token-hash",
      expiresAt: new Date("2026-09-17T00:00:00.000Z"),
    });
    mocks.findFirstUser.mockResolvedValue(null);
    mocks.createUser.mockResolvedValue(createdUser);
    mocks.getPrisma.mockReturnValue({
      user: {
        findFirst: mocks.findFirstUser,
        create: mocks.createUser,
      },
    });
    mocks.resolveRequestIp.mockReturnValue({
      ok: true,
      ipAddress: "203.0.113.10",
    });
    mocks.getRequestUserAgent.mockReturnValue("Vitest");
    mocks.hashPassword.mockResolvedValue("password-hash");
    mocks.sendEmailVerificationEmail.mockResolvedValue({
      id: "email-id",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an untrusted origin before reading or processing the body", async () => {
    const response = await POST(
      createRequest({ origin: "https://attacker.example" }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_ORIGIN" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoBusinessWork();
  });

  it("requires an application/json content type", async () => {
    const response = await POST(createRequest({ contentType: "text/plain" }));

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoBusinessWork();
  });

  it("limits actual streamed bytes even when Content-Length is understated", async () => {
    const oversizedBody = JSON.stringify("x".repeat(4 * 1_024));
    const response = await POST(
      createRequest({
        body: oversizedBody,
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
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoBusinessWork();
  });

  it("returns a no-store response for malformed JSON", async () => {
    const response = await POST(createRequest({ body: "{" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_JSON" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoBusinessWork();
  });

  it("rejects invalid UTF-8 instead of accepting replacement characters", async () => {
    const response = await POST(
      new Request(SIGN_UP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: TRUSTED_ORIGIN,
        },
        body: new Uint8Array([0x22, 0xc3, 0x28, 0x22]),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_JSON" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoBusinessWork();
  });

  it("rate limits by IP before password hashing and account queries", async () => {
    mocks.consumeAuthRateLimits.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 90,
    });

    const response = await POST(createRequest());

    expect(mocks.consumeAuthRateLimits).toHaveBeenCalledWith([
      {
        scope: "sign-up:ip:15m",
        limit: 5,
        windowMs: 15 * 60 * 1_000,
        value: "203.0.113.10",
      },
      {
        scope: "sign-up:ip:1h",
        limit: 20,
        windowMs: 60 * 60 * 1_000,
        value: "203.0.113.10",
      },
    ]);
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      code: "SIGN_UP_RATE_LIMITED",
      retryAfterSeconds: 90,
    });
    expect(response.headers.get("Retry-After")).toBe("90");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expectNoBusinessWork();
  });

  it("fails closed when the DB-backed rate limiter is unavailable", async () => {
    mocks.consumeAuthRateLimits.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expectNoBusinessWork();
  });

  it("preserves the successful response contract after the rate-limit check", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      user: {
        id: createdUser.id,
        email: createdUser.email,
      },
      emailDelivery: "sent",
    });

    expect(mocks.consumeAuthRateLimits).toHaveBeenCalledTimes(1);
    expect(mocks.consumeAuthRateLimits.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getPrisma.mock.invocationCallOrder[0],
    );
    expect(mocks.consumeAuthRateLimits.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.hashPassword.mock.invocationCallOrder[0],
    );
    expect(mocks.consumeAuthRateLimits.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.sendEmailVerificationEmail.mock.invocationCallOrder[0],
    );

    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessions: {
            create: expect.objectContaining({
              ipAddress: "203.0.113.10",
              userAgent: "Vitest",
            }),
          },
        }),
      }),
    );
    expect(mocks.sendEmailVerificationEmail).toHaveBeenCalledWith({
      to: createdUser.email,
      verificationToken: "verification-token",
      locale: "en",
    });
    expect(mocks.setSessionCookie).toHaveBeenCalledWith(
      response,
      "session-token",
      new Date("2026-09-17T00:00:00.000Z"),
    );
  });

  it("does not collapse development requests without an IP into a shared bucket", async () => {
    mocks.resolveRequestIp.mockReturnValue({
      ok: false,
      failClosed: false,
      reason: "CLIENT_IP_MISSING_OR_INVALID",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(201);
    expect(mocks.consumeAuthRateLimits).toHaveBeenCalledWith([]);
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessions: {
            create: expect.objectContaining({
              ipAddress: undefined,
            }),
          },
        }),
      }),
    );
  });

  it("fails closed before rate limiting or business work when trusted proxy resolution fails", async () => {
    mocks.resolveRequestIp.mockReturnValue({
      ok: false,
      failClosed: true,
      reason: "TRUSTED_PROXY_NOT_CONFIGURED",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      code: "SERVICE_UNAVAILABLE",
    });
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoBusinessWork();
  });
});
