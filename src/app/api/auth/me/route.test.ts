import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/shared/lib/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

import { GET } from "./route";

const request = new Request("https://courier-flow.example/api/auth/me");

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the current user without allowing the response to be cached", async () => {
    const user = {
      id: "user-id",
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+48123456789",
      role: "CLIENT",
      emailVerifiedAt: new Date("2026-08-18T00:00:00.000Z"),
      phoneVerifiedAt: null,
      createdAt: new Date("2026-08-17T00:00:00.000Z"),
    };

    mocks.getCurrentSession.mockResolvedValue({ user });

    const response = await GET(request as NextRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      user: {
        ...user,
        emailVerifiedAt: user.emailVerifiedAt.toISOString(),
        createdAt: user.createdAt.toISOString(),
      },
    });
  });

  it("returns a no-store unauthorized response without a session", async () => {
    mocks.getCurrentSession.mockResolvedValue(null);

    const response = await GET(request as NextRequest);

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ code: "UNAUTHORIZED" });
  });

  it("returns a no-store server error when session lookup fails", async () => {
    mocks.getCurrentSession.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(request as NextRequest);

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
