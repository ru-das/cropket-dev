// CLAUDE.md §6 "Mock adapters: mock output passes the same zod schema as
// real (test the pure mock.ts files)". cashfreeSignature and
// CashfreeWebhookEvent are pure too (no Deno/env import), so they're
// tested the same direct way.
import { describe, expect, it } from "vitest";
import { CashfreeOrder, CashfreeWebhookEvent } from "@shared/schemas/escrow.ts";
import { createOrder as mockCreateOrder } from "../../../../supabase/functions/_shared/integrations/cashfree/mock.ts";
import { cashfreeSignature } from "../../../../supabase/functions/_shared/integrations/cashfree/signature.ts";

const ORDER_INPUT = { orderId: "order-abc", amountPaise: 959500, customerId: "buyer-1" };

describe("integrations/cashfree mock", () => {
  it("returns an order that passes CashfreeOrder, the same schema real.ts must pass", async () => {
    const order = await mockCreateOrder(ORDER_INPUT);
    expect(CashfreeOrder.safeParse(order).success).toBe(true);
  });

  it("always marks itself as a mock, with no checkout session to open", async () => {
    const order = await mockCreateOrder(ORDER_INPUT);
    expect(order.source).toBe("mock");
    expect(order.paymentSessionId).toBeNull();
  });

  it("echoes the given order id", async () => {
    const order = await mockCreateOrder(ORDER_INPUT);
    expect(order.orderId).toBe("order-abc");
  });
});

describe("integrations/cashfree cashfreeSignature", () => {
  it("matches a known-answer vector (computed independently with openssl)", async () => {
    // printf '%s' '1700000000{"type":"PAYMENT_SUCCESS_WEBHOOK"}' \
    //   | openssl dgst -sha256 -hmac "test-secret" -binary | openssl base64 -A
    const signature = await cashfreeSignature(
      "test-secret",
      "1700000000",
      '{"type":"PAYMENT_SUCCESS_WEBHOOK"}',
    );
    expect(signature).toBe("TYvan3VZVjOUX03MD0QLtx6zOkjxchD0NDloGGQ/x0g=");
  });

  it("gives a different signature when the body changes by one byte", async () => {
    const secret = "test-secret";
    const timestamp = "1700000000";
    const a = await cashfreeSignature(secret, timestamp, '{"amount":100}');
    const b = await cashfreeSignature(secret, timestamp, '{"amount":101}');
    expect(a).not.toBe(b);
  });
});

describe("schemas/escrow CashfreeWebhookEvent", () => {
  const validEvent = {
    type: "PAYMENT_SUCCESS_WEBHOOK",
    data: {
      order: { order_id: "order-abc" },
      payment: { cf_payment_id: "pay_1", payment_status: "SUCCESS", payment_amount: 9595 },
    },
  };

  it("parses a valid Cashfree webhook payload", () => {
    expect(CashfreeWebhookEvent.safeParse(validEvent).success).toBe(true);
  });

  it("fails when order_id is missing", () => {
    const bad = { ...validEvent, data: { ...validEvent.data, order: {} } };
    expect(CashfreeWebhookEvent.safeParse(bad).success).toBe(false);
  });
});
