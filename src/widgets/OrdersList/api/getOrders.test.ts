import { afterEach, describe, expect, it, vi } from "vitest";

import type { OrderListItem } from "@/entities/order";

import { getOrders } from "./getOrders";

const ORDERS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    pickupAddress: "Warsaw Central Station",
    deliveryAddress: "Nowy Świat 10",
    status: "pending",
    createdAt: "2026-09-05T10:00:00.000Z",
  },
] satisfies OrderListItem[];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getOrders", () => {
  it("returns orders from a successful response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ orders: ORDERS }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();

    await expect(getOrders(controller.signal)).resolves.toEqual(ORDERS);

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/orders", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
  });
  it("throws the API error code for an unsuccessful response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: "INTERNAL_SERVER_ERROR" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();

    await expect(getOrders(controller.signal)).rejects.toThrow(
      "INTERNAL_SERVER_ERROR",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("throws a fallback error when orders is not an array", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ orders: {} }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();

    await expect(getOrders(controller.signal)).rejects.toThrow(
      "GET_ORDERS_FAILED",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
