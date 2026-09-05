import { afterEach, describe, expect, it, vi } from "vitest";

import type { OrderDetailsItem } from "@/entities/order";

import { getOrder } from "./getOrder";

const ORDER = {
  id: "11111111-1111-4111-8111-111111111111",
  pickupAddress: "Warsaw Central Station",
  deliveryAddress: "Nowy Świat 10",
  recipientName: "Test Recipient",
  recipientPhone: "+48500600700",
  comment: null,
  status: "pending",
  createdAt: "2026-09-05T10:00:00.000Z",
  updatedAt: "2026-09-05T10:00:00.000Z",
} satisfies OrderDetailsItem;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getOrder", () => {
  it("returns an order from a successful response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ order: ORDER }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await expect(getOrder(ORDER.id, controller.signal)).resolves.toEqual(ORDER);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(`/api/orders/${ORDER.id}`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
  });
  it("returns null when the order is not found", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));

    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();

    await expect(getOrder(ORDER.id, controller.signal)).resolves.toBeNull();
  });
  it("throws the API error code for an unsuccessful response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: "FORBIDDEN" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();

    await expect(getOrder(ORDER.id, controller.signal)).rejects.toThrow(
      "FORBIDDEN",
    );
  });
  it("throws a fallback error when the response has no order", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();

    await expect(getOrder(ORDER.id, controller.signal)).rejects.toThrow(
      "GET_ORDER_FAILED",
    );
  });
});
