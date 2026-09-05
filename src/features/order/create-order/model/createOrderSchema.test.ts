import { describe, expect, it } from "vitest";

import { createOrderRequestSchema } from "./createOrderRequestSchema";

const validOrder = {
  pickupAddress: "Plac Europejski 1, Warszawa",
  deliveryAddress: "Marszałkowska 126/134, Warszawa",
  recipientName: "Anna Kowalska",
  recipientPhone: "+48 (123) 456-789",
  comment: "   ",
};

describe("createOrderRequestSchema", () => {
  it("produces a payload that can be validated again", () => {
    const normalizedOrder = createOrderRequestSchema.parse(validOrder);

    expect(normalizedOrder).toMatchObject({
      recipientPhone: "+48123456789",
      comment: null,
    });
    expect(createOrderRequestSchema.safeParse(normalizedOrder).success).toBe(
      true,
    );
  });
});
