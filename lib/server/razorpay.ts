import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { BranchId } from "@/lib/branches";

/**
 * Razorpay, one account per branch: Sangli's money lands in Sangli's bank,
 * Karad's in Karad's. Keys come from the environment and never leave the
 * server — the browser only ever receives the public key id.
 *
 *   RAZORPAY_SANGLI_KEY_ID / _KEY_SECRET / _WEBHOOK_SECRET
 *   RAZORPAY_KARAD_KEY_ID  / _KEY_SECRET / _WEBHOOK_SECRET
 */

interface Keys {
  keyId: string;
  keySecret: string;
  webhookSecret: string | null;
}

function keysFor(branch: BranchId): Keys | null {
  const prefix = `RAZORPAY_${branch.toUpperCase()}`;
  const keyId = process.env[`${prefix}_KEY_ID`];
  const keySecret = process.env[`${prefix}_KEY_SECRET`];
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, webhookSecret: process.env[`${prefix}_WEBHOOK_SECRET`] ?? null };
}

export function onlinePaymentAvailable(branch: BranchId): boolean {
  return keysFor(branch) !== null;
}

function requireKeys(branch: BranchId): Keys {
  const keys = keysFor(branch);
  if (!keys) throw new Error(`Razorpay is not configured for ${branch}.`);
  return keys;
}

async function call<T>(branch: BranchId, path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { keyId, keySecret } = requireKeys(branch);
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    // Razorpay's error body can echo request details; log the code only.
    let code = "";
    try {
      code = ((await response.json()) as { error?: { code?: string } })?.error?.code ?? "";
    } catch {
      // ignore
    }
    throw new Error(`Razorpay ${path.split("/")[1]} failed: HTTP ${response.status} ${code}`);
  }
  return (await response.json()) as T;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export function createOrder(
  branch: BranchId,
  amountPaise: number,
  receipt: string,
  notes: Record<string, string>
): Promise<RazorpayOrder> {
  return call<RazorpayOrder>(branch, "/orders", {
    method: "POST",
    body: { amount: amountPaise, currency: "INR", receipt, notes, payment_capture: 1 },
  });
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string;
}

export async function fetchCapturedPayment(branch: BranchId, paymentId: string): Promise<RazorpayPayment> {
  let payment = await call<RazorpayPayment>(branch, `/payments/${encodeURIComponent(paymentId)}`);
  // Accounts with manual capture leave the payment "authorized"; capture it
  // so the spa actually receives the money.
  if (payment.status === "authorized") {
    payment = await call<RazorpayPayment>(branch, `/payments/${encodeURIComponent(paymentId)}/capture`, {
      method: "POST",
      body: { amount: payment.amount, currency: payment.currency },
    });
  }
  return payment;
}

export function publicKeyId(branch: BranchId): string {
  return requireKeys(branch).keyId;
}

function safeEqualHex(expectedHex: string, receivedHex: string): boolean {
  if (!/^[0-9a-f]+$/i.test(receivedHex)) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** The signature Checkout hands back after a successful payment. */
export function verifyCheckoutSignature(
  branch: BranchId,
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const { keySecret } = requireKeys(branch);
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** X-Razorpay-Signature on a webhook, computed over the exact raw body. */
export function verifyWebhookSignature(branch: BranchId, rawBody: string, signature: string): boolean {
  const keys = keysFor(branch);
  if (!keys?.webhookSecret) return false;
  const expected = createHmac("sha256", keys.webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
