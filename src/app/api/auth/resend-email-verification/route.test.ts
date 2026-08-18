import type { NextRequest } from "next/server";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeAuthRateLimits: vi.fn(),
  createAuthToken: vi.fn(),
  getCurrentSession: vi.fn(),
  getPrisma: vi.fn(),
  hashAuthToken: vi.fn(),
  resolveRequestIp: vi.fn(),
  sendEmailVerificationEmail: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/generated/prisma/client", () => ({
  AuthChallengeType: {
    EMAIL_CHANGE: "EMAIL_CHANGE",
    EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  },
}));

vi.mock("@/i18n/routing", () => ({
  isAppLocale: (value: string) => value === "en",
  routing: {
    defaultLocale: "en",
  },
}));

vi.mock("@/shared/lib/authRateLimit", () => ({
  consumeAuthRateLimits: mocks.consumeAuthRateLimits,
}));

vi.mock("@/shared/lib/authToken", () => ({
  createAuthToken: mocks.createAuthToken,
  hashAuthToken: mocks.hashAuthToken,
}));

vi.mock("@/shared/lib/email", () => ({
  sendEmailVerificationEmail: mocks.sendEmailVerificationEmail,
}));

vi.mock("@/shared/lib/prisma", () => ({
  getPrisma: mocks.getPrisma,
}));

vi.mock("@/shared/lib/request", () => ({
  resolveRequestIp: mocks.resolveRequestIp,
}));

vi.mock("@/shared/lib/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

import { POST } from "./route";

const RESEND_URL =
  "https://courier-flow.example/api/auth/resend-email-verification";
const TRUSTED_ORIGIN = new URL(RESEND_URL).origin;
const USER_ID = "72d88930-9c33-4637-aa41-5d49092aeb44";
const USER_EMAIL = "user@example.com";
const IP_ADDRESS = "203.0.113.10";

type CreateRequestOptions = {
  body?: BodyInit;
  contentType?: string | null;
  headers?: HeadersInit;
  origin?: string | null;
};

function createRequest({
  body = JSON.stringify({ locale: "en" }),
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

  return new Request(RESEND_URL, {
    method: "POST",
    headers: requestHeaders,
    body,
  }) as NextRequest;
}

function expectNoContextOrSideEffects(): void {
  expect(mocks.getCurrentSession).not.toHaveBeenCalled();
  expect(mocks.getPrisma).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.createAuthToken).not.toHaveBeenCalled();
  expect(mocks.sendEmailVerificationEmail).not.toHaveBeenCalled();
}

describe("POST /api/auth/resend-email-verification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    mocks.consumeAuthRateLimits.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getCurrentSession.mockResolvedValue({
      id: "session-id",
      user: {
        id: USER_ID,
        email: USER_EMAIL,
        emailVerifiedAt: null,
      },
    });
    mocks.getPrisma.mockReturnValue({
      $transaction: mocks.transaction,
    });
    mocks.resolveRequestIp.mockReturnValue({
      ok: true,
      ipAddress: IP_ADDRESS,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an untrusted origin before rate limits or business work", async () => {
    const response = await POST(
      createRequest({ origin: "https://attacker.example" }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_ORIGIN" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.resolveRequestIp).not.toHaveBeenCalled();
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoContextOrSideEffects();
  });

  it("requires an application/json content type", async () => {
    const response = await POST(createRequest({ contentType: "text/plain" }));

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.resolveRequestIp).not.toHaveBeenCalled();
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoContextOrSideEffects();
  });

  it("limits actual streamed bytes when Content-Length is understated", async () => {
    const response = await POST(
      createRequest({
        body: JSON.stringify({ locale: "x".repeat(4 * 1_024) }),
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
    expect(mocks.resolveRequestIp).not.toHaveBeenCalled();
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoContextOrSideEffects();
  });

  it("fails closed before rate limits or context lookup on a production IP policy error", async () => {
    mocks.resolveRequestIp.mockReturnValue({
      ok: false,
      failClosed: true,
      reason: "TRUSTED_PROXY_NOT_CONFIGURED",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: "SERVICE_UNAVAILABLE",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
    expectNoContextOrSideEffects();
  });

  it("rate limits by IP before account lookup or email side effects", async () => {
    mocks.consumeAuthRateLimits.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 90,
    });

    const response = await POST(createRequest());

    expect(mocks.consumeAuthRateLimits).toHaveBeenCalledWith([
      {
        scope: "resend-email-verification:ip:1h",
        limit: 20,
        windowMs: 60 * 60 * 1_000,
        value: IP_ADDRESS,
      },
    ]);
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      code: "RESEND_TOO_SOON",
      retryAfterSeconds: 90,
    });
    expect(response.headers.get("Retry-After")).toBe("90");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expectNoContextOrSideEffects();
  });

  it("rate limits by opaque user id after context lookup and before database or email side effects", async () => {
    mocks.consumeAuthRateLimits
      .mockResolvedValueOnce({
        allowed: true,
        retryAfterSeconds: 0,
      })
      .mockResolvedValueOnce({
        allowed: false,
        retryAfterSeconds: 120,
      });

    const response = await POST(createRequest());

    expect(mocks.consumeAuthRateLimits).toHaveBeenNthCalledWith(1, [
      {
        scope: "resend-email-verification:ip:1h",
        limit: 20,
        windowMs: 60 * 60 * 1_000,
        value: IP_ADDRESS,
      },
    ]);
    expect(mocks.consumeAuthRateLimits).toHaveBeenNthCalledWith(2, [
      {
        scope: "resend-email-verification:user:1h",
        limit: 5,
        windowMs: 60 * 60 * 1_000,
        value: USER_ID,
      },
    ]);
    expect(JSON.stringify(mocks.consumeAuthRateLimits.mock.calls)).not.toContain(
      USER_EMAIL,
    );
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      code: "RESEND_TOO_SOON",
      retryAfterSeconds: 120,
    });
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.getCurrentSession).toHaveBeenCalledOnce();
    expect(mocks.getPrisma).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it("omits only the IP bucket for a non-production request without a trusted IP", async () => {
    mocks.resolveRequestIp.mockReturnValue({
      ok: false,
      failClosed: false,
      reason: "CLIENT_IP_MISSING_OR_INVALID",
    });
    mocks.consumeAuthRateLimits
      .mockResolvedValueOnce({
        allowed: true,
        retryAfterSeconds: 0,
      })
      .mockResolvedValueOnce({
        allowed: false,
        retryAfterSeconds: 30,
      });

    const response = await POST(createRequest());

    expect(mocks.consumeAuthRateLimits).toHaveBeenNthCalledWith(1, []);
    expect(mocks.consumeAuthRateLimits).toHaveBeenNthCalledWith(2, [
      {
        scope: "resend-email-verification:user:1h",
        limit: 5,
        windowMs: 60 * 60 * 1_000,
        value: USER_ID,
      },
    ]);
    expect(response.status).toBe(429);
    expect(mocks.getPrisma).not.toHaveBeenCalled();
    expect(mocks.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it("preserves the already-verified state response after both server limits", async () => {
    mocks.transaction.mockResolvedValue({
      status: "ALREADY_VERIFIED",
    });

    const response = await POST(createRequest());

    expect(mocks.consumeAuthRateLimits).toHaveBeenCalledTimes(2);
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(
      mocks.consumeAuthRateLimits.mock.invocationCallOrder[1],
    ).toBeLessThan(mocks.transaction.mock.invocationCallOrder[0]);
    expect(mocks.sendEmailVerificationEmail).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      code: "EMAIL_ALREADY_VERIFIED",
      retryAfterSeconds: 0,
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("commits the staged challenge before email delivery and revokes prior challenges when finalizing", async () => {
    const events: string[] = [];
    const challengeCreatedAt = new Date();
    const createChallenge = vi.fn(async () => {
      events.push("create-staged-challenge");

      return {
        id: "new-challenge-id",
        createdAt: challengeCreatedAt,
      };
    });
    const revokePriorChallenges = vi.fn(async () => {
      events.push("revoke-prior-challenges");

      return { count: 2 };
    });
    const issueTransaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      authChallenge: {
        create: createChallenge,
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      session: {
        findFirst: vi.fn().mockResolvedValue({ id: "session-id" }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: USER_ID,
          email: USER_EMAIL,
          emailVerifiedAt: null,
        }),
      },
    };
    const finalizeTransaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      authChallenge: {
        findFirst: vi.fn().mockResolvedValue({ id: "new-challenge-id" }),
        updateMany: revokePriorChallenges,
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          email: USER_EMAIL,
          emailVerifiedAt: null,
        }),
      },
    };

    mocks.createAuthToken.mockReturnValue({
      token: "new-verification-token",
      tokenHash: "new-verification-token-hash",
    });
    mocks.sendEmailVerificationEmail.mockImplementation(async () => {
      events.push("send-email");

      return { id: "email-id" };
    });
    mocks.transaction
      .mockImplementationOnce(async (callback) => {
        const result = await callback(issueTransaction);

        events.push("issue-commit");

        return result;
      })
      .mockImplementationOnce(async (callback) => {
        const result = await callback(finalizeTransaction);

        events.push("finalize-commit");

        return result;
      });

    const response = await POST(createRequest());

    expect(events).toEqual([
      "create-staged-challenge",
      "issue-commit",
      "send-email",
      "revoke-prior-challenges",
      "finalize-commit",
    ]);
    expect(createChallenge).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        type: "EMAIL_VERIFICATION",
        secretHash: "new-verification-token-hash",
        target: USER_EMAIL,
        expiresAt: expect.any(Date),
      },
      select: {
        id: true,
        createdAt: true,
      },
    });
    expect(mocks.sendEmailVerificationEmail).toHaveBeenCalledWith({
      to: USER_EMAIL,
      verificationToken: "new-verification-token",
      locale: "en",
    });
    expect(revokePriorChallenges).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        type: "EMAIL_VERIFICATION",
        target: USER_EMAIL,
        id: {
          not: "new-challenge-id",
        },
        consumedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      code: "VERIFICATION_TOKEN_REISSUED",
      retryAfterSeconds: expect.any(Number),
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
