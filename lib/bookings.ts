/**
 * Browser side of booking: talks to /api/bookings and Razorpay Checkout.
 * Nothing about the guest is kept in the browser after the request is sent.
 */
import type { BranchId } from "@/lib/branches";

export interface BookingRequest {
  branch: BranchId;
  therapyId: string;
  minutes: number;
  date: string;
  slot: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  therapistPref: "female" | "male" | "any";
  paymentMode: "online" | "at_spa";
  consent: boolean;
}

export interface CheckoutDetails {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: "INR";
  name: string;
  description: string;
  prefill: { name: string; contact: string; email?: string };
}

export type BookingResult =
  | { ok: true; reference: string; status: string; amountInr: number; payment?: CheckoutDetails }
  | { ok: false; error: string };

export async function createBooking(request: BookingRequest): Promise<BookingResult> {
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const data = await response.json().catch(() => null);
    if (!data) return { ok: false, error: "SERVER_ERROR" };
    return data as BookingResult;
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export async function verifyPayment(payload: {
  reference: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ ok: boolean; status?: string; error?: string }> {
  try {
    const response = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await response.json().catch(() => ({ ok: false, error: "SERVER_ERROR" }))) as {
      ok: boolean;
      status?: string;
      error?: string;
    };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

/** Start times already full on that day. Empty when it can't be checked — the server still refuses a full slot. */
export async function fetchFullSlots(branch: BranchId, date: string, minutes: number): Promise<string[]> {
  try {
    const params = new URLSearchParams({ branch, date, minutes: String(minutes) });
    const response = await fetch(`/api/availability?${params}`, { cache: "no-store" });
    const data = (await response.json()) as { ok: boolean; full?: string[] };
    return data.ok && Array.isArray(data.full) ? data.full : [];
  } catch {
    return [];
  }
}

export interface GuestBooking {
  reference: string;
  branch: BranchId;
  therapyTitle: string;
  minutes: number;
  date: string;
  slot: string;
  name: string;
  amountInr: number;
  paymentMode: "online" | "at_spa";
  paid: boolean;
  status: "pending_payment" | "pending_confirmation" | "confirmed" | "completed" | "cancelled";
  canCancel: boolean;
  cancelBlockedBy: "NOT_ACTIVE" | "STARTED" | "TOO_LATE_FOR_REFUND" | null;
}

/** A guest's own booking, by reference and mobile number. */
export async function manageBooking(
  action: "view" | "cancel",
  reference: string,
  phone: string
): Promise<{ ok: true; booking: GuestBooking } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/bookings/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reference, phone }),
    });
    return (await response.json().catch(() => ({ ok: false, error: "SERVER_ERROR" }))) as
      | { ok: true; booking: GuestBooking }
      | { ok: false; error: string };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export async function fetchPaymentOptions(): Promise<Record<BranchId, boolean>> {
  try {
    const response = await fetch("/api/payment-options");
    if (response.ok) return (await response.json()) as Record<BranchId, boolean>;
  } catch {
    // fall through
  }
  return { sangli: false, karad: false };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<boolean> | null = null;

function loadCheckoutScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        scriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Opens Razorpay Checkout. Resolves with the signed response on success,
 * "dismissed" if the guest closed it, or "unavailable" if it couldn't load.
 */
export async function openCheckout(
  details: CheckoutDetails,
  reference: string
): Promise<RazorpayResponse | "dismissed" | "unavailable"> {
  const loaded = await loadCheckoutScript();
  if (!loaded || !window.Razorpay) return "unavailable";

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: RazorpayResponse | "dismissed") => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const checkout = new window.Razorpay!({
      key: details.keyId,
      order_id: details.orderId,
      amount: details.amountPaise,
      currency: details.currency,
      name: details.name,
      description: details.description,
      prefill: details.prefill,
      notes: { reference },
      theme: { color: "#c5a880" },
      retry: { enabled: true, max_count: 3 },
      handler: (response: RazorpayResponse) => finish(response),
      modal: { ondismiss: () => finish("dismissed"), confirm_close: true },
    });
    checkout.open();
  });
}
