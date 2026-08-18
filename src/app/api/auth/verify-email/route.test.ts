import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirstChallenge: vi.fn(),
  findTransactionChallenge: vi.fn(),
  findUser: vi.fn(),
  getPrisma: vi.fn(),
  hashAuthToken: vi.fn(),
  queryRaw: vi.fn(),
  transaction: vi.fn(),
  updateChallenges: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/generated/prisma/client", () => ({
  AuthChallengeType: {
    EMAIL_CHANGE: "EMAIL_CHANGE",
    EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  },
}));

vi.mock("@/shared/lib/authToken", () => ({
  hashAuthToken: mocks.hashAuthToken,
}));

vi.mock("@/shared/lib/prisma", () => ({
  getPrisma: mocks.getPrisma,
}));

import { POST } from "./route";

const VERIFY_EMAIL_URL =
  "https://courier-flow.example/api/auth/verify-email";
const TRUSTED_ORIGIN = new URL(VERIFY_EMAIL_URL).origin;
const CHALLENGE_ID = "challenge-id";
const USER_ID = "72d88930-9c33-4637-aa41-5d49092aeb44";
const USER_EMAIL = "user@example.com";

type CreateRequestOptions = {
  body?: BodyInit;
  contentType?: string | null;
  headers?: HeadersInit;
  origin?: string | null;
};

function createRequest({
  body = JSON.stringify({ token: "verification-token" }),
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

  return new Request(VERIFY_EMAIL_URL, {
    method: "POST",
    headers: requestHeaders,
    body,
  });
}

function expectNoBusinessWork(): void {
  expect(mocks.hashAuthToken).not.toHaveBeenCalled();
  expect(mocks.getPrisma).not.toHaveBeenCalled();
  expect(mocks.findFirstChallenge).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
}

type VerificationStateOptions = {
  challenge?: {
    consumedAt: Date | null;
    expiresAt: Date;
    revokedAt: Date | null;
    target: string;
  };
  consumeCount?: number;
  userEmailVerifiedAt?: Date | null;
};

function arrangeVerificationState({
  challenge = {
    consumedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    target: USER_EMAIL,
  },
  consumeCount = 1,
  userEmailVerifiedAt = null,
}: VerificationStateOptions = {}): void {
  mocks.findFirstChallenge.mockResolvedValue({
    id: CHALLENGE_ID,
    userId: USER_ID,
  });
  mocks.findUser.mockResolvedValue({
    email: USER_EMAIL,
    emailVerifiedAt: userEmailVerifiedAt,
  });
  mocks.findTransactionChallenge
    .mockResolvedValueOnce({
      id: CHALLENGE_ID,
      userId: USER_ID,
      ...challenge,
    })
    .mockResolvedValueOnce(null);
  mocks.queryRaw.mockResolvedValue([]);
  mocks.updateChallenges
    .mockResolvedValueOnce({ count: consumeCount })
    .mockResolvedValueOnce({ count: 1 });
  mocks.updateUser.mockResolvedValue({ id: USER_ID });
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      $queryRaw: mocks.queryRaw,
      authChallenge: {
        findFirst: mocks.findTransactionChallenge,
        updateMany: mocks.updateChallenges,
      },
      user: {
        findUnique: mocks.findUser,
        update: mocks.updateUser,
      },
    }),
  );
}

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mocks.hashAuthToken.mockReturnValue("verification-token-hash");
    mocks.findFirstChallenge.mockResolvedValue(null);
    mocks.getPrisma.mockReturnValue({
      authChallenge: {
        findFirst: mocks.findFirstChallenge,
      },
      $transaction: mocks.transaction,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an untrusted origin before business work", async () => {
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
        body: JSON.stringify({ token: "x".repeat(4 * 1_024) }),
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

  it("preserves the invalid-token state response after parsing", async () => {
    const response = await POST(createRequest());

    expect(mocks.hashAuthToken).toHaveBeenCalledWith("verification-token");
    expect(mocks.findFirstChallenge).toHaveBeenCalledOnce();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "VERIFICATION_TOKEN_INVALID",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("consumes exactly one challenge, verifies the user, and revokes competing challenges", async () => {
    arrangeVerificationState();

    const response = await POST(createRequest());

    expect(mocks.updateChallenges).toHaveBeenNthCalledWith(1, {
      where: {
        id: CHALLENGE_ID,
        consumedAt: null,
        revokedAt: null,
        expiresAt: {
          gt: expect.any(Date),
        },
      },
      data: {
        consumedAt: expect.any(Date),
      },
    });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: {
        id: USER_ID,
      },
      data: {
        emailVerifiedAt: expect.any(Date),
      },
    });
    expect(mocks.updateChallenges).toHaveBeenNthCalledWith(2, {
      where: {
        userId: USER_ID,
        type: "EMAIL_VERIFICATION",
        id: {
          not: CHALLENGE_ID,
        },
        consumedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ code: "EMAIL_VERIFIED" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns already verified for a challenge consumed by the verified user", async () => {
    const verifiedAt = new Date(Date.now() - 1_000);

    arrangeVerificationState({
      challenge: {
        consumedAt: verifiedAt,
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        target: USER_EMAIL,
      },
      userEmailVerifiedAt: verifiedAt,
    });

    const response = await POST(createRequest());

    expect(mocks.updateChallenges).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      code: "EMAIL_ALREADY_VERIFIED",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns expired without consuming or verifying the user", async () => {
    arrangeVerificationState({
      challenge: {
        consumedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
        revokedAt: null,
        target: USER_EMAIL,
      },
    });

    const response = await POST(createRequest());

    expect(mocks.updateChallenges).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      code: "VERIFICATION_TOKEN_EXPIRED",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects a revoked challenge without mutating user state", async () => {
    arrangeVerificationState({
      challenge: {
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(Date.now() - 1_000),
        target: USER_EMAIL,
      },
    });

    const response = await POST(createRequest());

    expect(mocks.updateChallenges).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "VERIFICATION_TOKEN_INVALID",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects a lost consume race when the single-use update affects no row", async () => {
    arrangeVerificationState({ consumeCount: 0 });

    const response = await POST(createRequest());

    expect(mocks.updateChallenges).toHaveBeenCalledOnce();
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "VERIFICATION_TOKEN_INVALID",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
