import { NextRequest } from "next/server";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST as signIn } from "@/app/api/auth/sign-in/route";

import { UserRole } from "@/generated/prisma/client";
import { hashPassword } from "@/shared/lib/password";
import { getPrisma } from "@/shared/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/shared/config/auth";
import { hashAuthToken } from "@/shared/lib/authToken";

import {
  TEST_EMAIL,
  TEST_PHONE,
  TEST_NAME,
  TEST_PASSWORD,
  TEST_EMAIL_VERIFIED_AT,
  TEST_IP_ADDRESS,
  TEST_USER_AGENT,
} from "./constants";

type TestPrismaClient = ReturnType<typeof getPrisma>;

let prisma: TestPrismaClient | undefined;

const assertSafeIntegrationDatabase = (): URL => {
  if (process.env.RUN_DATABASE_INTEGRATION_TESTS !== "1") {
    throw new Error(
      "Database integration tests require RUN_DATABASE_INTEGRATION_TESTS=1",
    );
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database integration tests");
  }

  let parsedDatabaseUrl: URL;

  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid URL");
  }

  const isPostgresProtocol =
    parsedDatabaseUrl.protocol === "postgresql:" ||
    parsedDatabaseUrl.protocol === "postgres:";

  if (!isPostgresProtocol) {
    throw new Error("DATABASE_URL must use the PostgreSQL protocol");
  }

  const isLoopbackHost =
    parsedDatabaseUrl.hostname === "127.0.0.1" ||
    parsedDatabaseUrl.hostname === "localhost";

  if (!isLoopbackHost) {
    throw new Error(
      "Integration tests may only use a loopback PostgreSQL host",
    );
  }

  if (parsedDatabaseUrl.pathname !== "/courier_flow_ci") {
    throw new Error(
      "Integration tests may only use the courier_flow_ci database",
    );
  }

  return parsedDatabaseUrl;
};

const clearTestData = async (client: TestPrismaClient): Promise<void> => {
  await client.$transaction([
    client.user.deleteMany({
      where: {
        OR: [{ email: TEST_EMAIL }, { phone: TEST_PHONE }],
      },
    }),
    client.authRateLimitBucket.deleteMany(),
  ]);
};

describe("POST /api/auth/sign-in with PostgreSQL", () => {
  beforeAll(async () => {
    assertSafeIntegrationDatabase();

    const client = getPrisma();
    prisma = client;

    await clearTestData(client);

    const passwordHash = await hashPassword(TEST_PASSWORD);

    await client.user.create({
      data: {
        role: UserRole.CLIENT,
        name: TEST_NAME,
        email: TEST_EMAIL,
        phone: TEST_PHONE,
        passwordHash,
        emailVerifiedAt: TEST_EMAIL_VERIFIED_AT,
        phoneVerifiedAt: null,
      },
    });
  });

  afterAll(async () => {
    const client = prisma;

    if (!client) {
      return;
    }

    try {
      await clearTestData(client);
    } finally {
      await client.$disconnect();
    }
  });

  it("signs in through the real auth route and persists a session", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        "X-Forwarded-For": TEST_IP_ADDRESS,
        "User-Agent": TEST_USER_AGENT,
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const response = await signIn(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    await expect(response.json()).resolves.toMatchObject({
      code: "SIGNED_IN",
      user: {
        id: expect.any(String),
        role: UserRole.CLIENT,
        name: TEST_NAME,
        email: TEST_EMAIL,
        phone: TEST_PHONE,
        emailVerifiedAt: TEST_EMAIL_VERIFIED_AT.toISOString(),
        phoneVerifiedAt: null,
      },
      next: "HOME",
    });
    const sessionCookie = response.cookies.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      throw new Error("Successful sign-in did not set a session cookie");
    }

    expect(sessionCookie.httpOnly).toBe(true);
    expect(sessionCookie.path).toBe("/");
    expect(sessionCookie.sameSite).toBe("lax");

    const client = prisma;

    if (!client) {
      throw new Error("Prisma Client was not initialized");
    }

    const storedUser = await client.user.findUniqueOrThrow({
      where: {
        email: TEST_EMAIL,
      },
    });

    const storedSession = await client.session.findUnique({
      where: {
        tokenHash: hashAuthToken(sessionCookie.value),
      },
    });

    if (!storedSession) {
      throw new Error("Session cookie has no matching PostgreSQL session");
    }

    expect(storedSession).toMatchObject({
      userId: storedUser.id,
      ipAddress: TEST_IP_ADDRESS,
      userAgent: TEST_USER_AGENT,
      revokedAt: null,
    });

    expect(storedSession.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
