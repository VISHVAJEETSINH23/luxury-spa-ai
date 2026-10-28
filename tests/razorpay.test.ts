import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { onlinePaymentAvailable, verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/server/razorpay";

beforeEach(() => {
  process.env.RAZORPAY_SANGLI_KEY_ID = "rzp_test_sangli";
  process.env.RAZORPAY_SANGLI_KEY_SECRET = "sangli-secret";
  process.env.RAZORPAY_SANGLI_WEBHOOK_SECRET = "sangli-hook";
  delete process.env.RAZORPAY_KARAD_KEY_ID;
  delete process.env.RAZORPAY_KARAD_KEY_SECRET;
  delete process.env.RAZORPAY_KARAD_WEBHOOK_SECRET;
});

const hmac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("hex");

describe("checkout signature", () => {
  it("accepts Razorpay's signature for this order and payment", () => {
    const sig = hmac("sangli-secret", "order_A|pay_B");
    expect(verifyCheckoutSignature("sangli", "order_A", "pay_B", sig)).toBe(true);
  });

  it("rejects a signature for a different payment", () => {
    const sig = hmac("sangli-secret", "order_A|pay_OTHER");
    expect(verifyCheckoutSignature("sangli", "order_A", "pay_B", sig)).toBe(false);
  });

  it("rejects non-hex and wrong-length input without throwing", () => {
    expect(verifyCheckoutSignature("sangli", "order_A", "pay_B", "zz")).toBe(false);
    expect(verifyCheckoutSignature("sangli", "order_A", "pay_B", "abcd")).toBe(false);
  });
});

describe("webhook signature", () => {
  const body = JSON.stringify({ event: "payment.captured" });

  it("accepts the branch's own webhook signature", () => {
    expect(verifyWebhookSignature("sangli", body, hmac("sangli-hook", body))).toBe(true);
  });

  it("rejects a body changed after signing", () => {
    expect(verifyWebhookSignature("sangli", body + " ", hmac("sangli-hook", body))).toBe(false);
  });

  it("rejects everything for a branch with no webhook secret", () => {
    expect(verifyWebhookSignature("karad", body, hmac("", body))).toBe(false);
  });
});

describe("online payment availability", () => {
  it("is on only for branches with keys", () => {
    expect(onlinePaymentAvailable("sangli")).toBe(true);
    expect(onlinePaymentAvailable("karad")).toBe(false);
  });
});
