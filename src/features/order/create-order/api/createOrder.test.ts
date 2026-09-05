import { afterEach, describe, expect, it, vi } from "vitest";

import type { OrderDetailsItem } from "@/entities/order";

import type { CreateOrderFormValues } from "../types";

import { createOrder } from "./createOrder";

const VALUES = {
  pickupAddress: "Warsaw Central Station",
  deliveryAddress: "Nowy Świat 10",
  recipientName: "Test Recipient",
  recipientPhone: "+48500600700",
  comment: null,
} satisfies CreateOrderFormValues;

const ORDER = {
  id: "11111111-1111-4111-8111-111111111111",
  ...VALUES,
  status: "pending",
  createdAt: "2026-09-05T10:00:00.000Z",
  updatedAt: "2026-09-05T10:00:00.000Z",
} satisfies OrderDetailsItem;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createOrder", () => {
  it("returns the created order and sends the form values", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ order: ORDER }), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(createOrder(VALUES)).resolves.toEqual(ORDER);

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(VALUES),
    });
  });
  it("throws the API error code for an unsuccessful response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: "VALIDATION_ERROR" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createOrder(VALUES)).rejects.toThrow("VALIDATION_ERROR");

    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("throws a fallback error when the response has no order", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createOrder(VALUES)).rejects.toThrow("CREATE_ORDER_FAILED");

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
