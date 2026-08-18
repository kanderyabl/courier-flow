import { NextRequest } from "next/server";
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
    authChallengeFindFirst: vi.fn(),
    clearAuthRateLimits: vi.fn(),
    clearSessionCookie: vi.fn(),
    consumeAuthRateLimits: vi.fn(),
    getPrisma: vi.fn(),
    hashAuthToken: vi.fn(),
    hashPassword: vi.fn(),
    sessionUpdateMany: vi.fn(),
    userFindUnique: vi.fn(),
    verifyPasswordOrDummy: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@/generated/prisma/client", () => ({
  AuthChallengeType: {
    EMAIL_CHANGE: "EMAIL_CHANGE",
    PASSWORD_RESET: "PASSWORD_RESET",
    PHONE_CHANGE: "PHONE_CHANGE",
  },
  Prisma: {
    PrismaClientKnownRequestError: mocks.PrismaClientKnownRequestError,
  },
}));

vi.mock("@/i18n/routing", () => ({
  isAppLocale: (value: string) => value === "en",
  routing: { defaultLocale: "en" },
}));

vi.mock("@/shared/lib/authRateLimit", () => ({
  clearAuthRateLimits: mocks.clearAuthRateLimits,
  consumeAuthRateLimits: mocks.consumeAuthRateLimits,
}));

vi.mock("@/shared/lib/authToken", () => ({
  createAuthToken: vi.fn(),
  hashAuthToken: mocks.hashAuthToken,
}));

vi.mock("@/shared/lib/email", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("@/shared/lib/password", () => ({
  hashPassword: mocks.hashPassword,
  verifyPasswordOrDummy: mocks.verifyPasswordOrDummy,
}));

vi.mock("@/shared/lib/prisma", () => ({
  getPrisma: mocks.getPrisma,
}));

vi.mock("@/shared/lib/session", () => ({
  clearSessionCookie: mocks.clearSessionCookie,
  createSessionToken: vi.fn(),
  SESSION_COOKIE_NAME: "courier_flow_session",
  setSessionCookie: vi.fn(),
}));

import { POST as forgotPassword } from "./forgot-password/route";
import { POST as resetPassword } from "./reset-password/route";
import { POST as signIn } from "./sign-in/route";
import { POST as signOut } from "./sign-out/route";

const ORIGIN = "https://courier-flow.example";

type JsonRoute = (request: NextRequest) => Promise<Response>;

function createJsonRequest(
  path: string,
  body: BodyInit,
  {
    contentType = "application/json",
    origin = ORIGIN,
    headers,
  }: {
    contentType?: string | null;
    origin?: string | null;
    headers?: HeadersInit;
  } = {},
): NextRequest {
  const requestHeaders = new Headers(headers);

  if (contentType !== null) {
    requestHeaders.set("Content-Type", contentType);
  }

  if (origin !== null) {
    requestHeaders.set("Origin", origin);
  }

  return new NextRequest(`${ORIGIN}${path}`, {
    method: "POST",
    headers: requestHeaders,
    body,
  });
}

function expectNoAuthSideEffects(): void {
  expect(mocks.consumeAuthRateLimits).not.toHaveBeenCalled();
  expect(mocks.getPrisma).not.toHaveBeenCalled();
  expect(mocks.hashPassword).not.toHaveBeenCalled();
  expect(mocks.verifyPasswordOrDummy).not.toHaveBeenCalled();
}

describe("auth route HTTP boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("TRUSTED_PROXY_HEADER", "");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mocks.consumeAuthRateLimits.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.clearAuthRateLimits.mockResolvedValue(undefined);
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.authChallengeFindFirst.mockResolvedValue(null);
    mocks.verifyPasswordOrDummy.mockResolvedValue(false);
    mocks.getPrisma.mockReturnValue({
      authChallenge: {
        findFirst: mocks.authChallengeFindFirst,
      },
      session: {
        updateMany: mocks.sessionUpdateMany,
      },
      user: {
        findUnique: mocks.userFindUnique,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ["sign-in", signIn, "/api/auth/sign-in"],
    ["forgot-password", forgotPassword, "/api/auth/forgot-password"],
    ["reset-password", resetPassword, "/api/auth/reset-password"],
  ] satisfies Array<[string, JsonRoute, string]>) (
    "rejects an untrusted origin before side effects for %s",
    async (_name, route, path) => {
      const response = await route(
        createJsonRequest(path, "{}", {
          origin: "https://attacker.example",
        }),
      );

      expect(response.status).toBe(403);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expectNoAuthSideEffects();
    },
  );

  it.each([
    ["sign-in", signIn, "/api/auth/sign-in"],
    ["forgot-password", forgotPassword, "/api/auth/forgot-password"],
    ["reset-password", resetPassword, "/api/auth/reset-password"],
  ] satisfies Array<[string, JsonRoute, string]>) (
    "rejects a non-JSON request before side effects for %s",
    async (_name, route, path) => {
      const response = await route(
        createJsonRequest(path, "{}", { contentType: "text/plain" }),
      );

      expect(response.status).toBe(415);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expectNoAuthSideEffects();
    },
  );

  it.each([
    ["sign-in", signIn, "/api/auth/sign-in"],
    ["forgot-password", forgotPassword, "/api/auth/forgot-password"],
    ["reset-password", resetPassword, "/api/auth/reset-password"],
  ] satisfies Array<[string, JsonRoute, string]>) (
    "enforces the actual streamed body limit for %s",
    async (_name, route, path) => {
      const response = await route(
        createJsonRequest(path, JSON.stringify({ value: "x".repeat(4_096) }), {
          headers: { "Content-Length": "1" },
        }),
      );

      expect(response.status).toBe(413);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      await expect(response.json()).resolves.toEqual({
        code: "PAYLOAD_TOO_LARGE",
      });
      expectNoAuthSideEffects();
    },
  );

  it.each([
    [
      "sign-in",
      signIn,
      "/api/auth/sign-in",
      { email: "ada@example.com", password: "password" },
    ],
    [
      "forgot-password",
      forgotPassword,
      "/api/auth/forgot-password",
      { email: "ada@example.com", locale: "en" },
    ],
    [
      "reset-password",
      resetPassword,
      "/api/auth/reset-password",
      { token: "reset-token", password: "Strong!Password1" },
    ],
  ] satisfies Array<[string, JsonRoute, string, Record<string, string>]>) (
    "fails closed before side effects when production IP trust is not configured for %s",
    async (_name, route, path, body) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("APP_URL", ORIGIN);

      const response = await route(
        createJsonRequest(path, JSON.stringify(body)),
      );

      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      await expect(response.json()).resolves.toEqual({
        code: "SERVICE_UNAVAILABLE",
      });
      expectNoAuthSideEffects();
    },
  );

  it("does not create global fallback buckets for sign-in without an IP", async () => {
    const response = await signIn(
      createJsonRequest(
        "/api/auth/sign-in",
        JSON.stringify({ email: "ada@example.com", password: "password" }),
      ),
    );

    expect(response.status).toBe(401);
    expect(mocks.consumeAuthRateLimits).toHaveBeenNthCalledWith(1, []);
    expect(mocks.consumeAuthRateLimits).toHaveBeenNthCalledWith(2, []);
    expect(mocks.consumeAuthRateLimits).toHaveBeenNthCalledWith(3, [
      expect.objectContaining({
        scope: "sign-in:account:15m",
        value: "ada@example.com",
      }),
    ]);
    expect(mocks.consumeAuthRateLimits.mock.calls.flat()).not.toContain(
      "unknown",
    );
  });

  it("keeps account limits without adding a fallback IP bucket for forgot-password", async () => {
    const response = await forgotPassword(
      createJsonRequest(
        "/api/auth/forgot-password",
        JSON.stringify({ email: "ada@example.com", locale: "en" }),
      ),
    );

    expect(response.status).toBe(202);
    expect(mocks.consumeAuthRateLimits).toHaveBeenCalledWith([
      expect.objectContaining({
        scope: "forgot-password:account:1m",
        value: "ada@example.com",
      }),
      expect.objectContaining({
        scope: "forgot-password:account:1h",
        value: "ada@example.com",
      }),
    ]);
  });

  it("keeps the token limit without adding a fallback IP bucket for reset-password", async () => {
    const response = await resetPassword(
      createJsonRequest(
        "/api/auth/reset-password",
        JSON.stringify({
          token: "reset-token",
          password: "Strong!Password1",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(mocks.consumeAuthRateLimits).toHaveBeenCalledWith([
      expect.objectContaining({
        scope: "reset-password:token:15m",
        value: "reset-token",
      }),
    ]);
  });

  it("rejects sign-out from an untrusted origin before reading the session", async () => {
    const response = await signOut(
      new NextRequest(`${ORIGIN}/api/auth/sign-out`, {
        method: "POST",
        headers: { Origin: "https://attacker.example" },
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.getPrisma).not.toHaveBeenCalled();
    expect(mocks.clearSessionCookie).not.toHaveBeenCalled();
  });

  it("returns a no-store idempotent response when no sign-out session exists", async () => {
    const response = await signOut(
      new NextRequest(`${ORIGIN}/api/auth/sign-out`, {
        method: "POST",
        headers: { Origin: ORIGIN },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.getPrisma).not.toHaveBeenCalled();
    expect(mocks.clearSessionCookie).toHaveBeenCalledWith(response);
  });
});
