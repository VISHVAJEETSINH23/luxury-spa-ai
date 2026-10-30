import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A tiny stand-in for the Supabase query builder: records every update with
 * its filters, and resolves each chain to { error: null }.
 */
const updates: { table: string; values: Record<string, unknown>; filters: [string, string, unknown][] }[] = [];

/** When set, confirming a booking fails the way the capacity trigger does. */
let slotFull = false;

function builder(table: string) {
  const entry = { table, values: {} as Record<string, unknown>, filters: [] as [string, string, unknown][] };
  const chain = {
    update(values: Record<string, unknown>) {
      entry.values = values;
      updates.push(entry);
      return chain;
    },
    eq(col: string, val: unknown) {
      entry.filters.push(["eq", col, val]);
      return chain;
    },
    neq(col: string, val: unknown) {
      entry.filters.push(["neq", col, val]);
      return chain;
    },
    then(resolve: (v: { error: { message: string } | null }) => void) {
      const refused = slotFull && entry.table === "bookings" && entry.values.status === "confirmed";
      resolve({ error: refused ? { message: "SLOT_FULL" } : null });
    },
  };
  return chain;
}

vi.mock("@/lib/server/supabase", () => ({ db: () => ({ from: builder }) }));
vi.mock("@/lib/server/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const { recordCapturedPayment } = await import("@/lib/server/payments");

const payment = {
  id: "pay-row-1",
  booking_id: "booking-1",
  branch: "karad" as const,
  razorpay_order_id: "order_X",
  razorpay_payment_id: null,
  amount_paise: 360000,
  status: "created" as const,
  method: null,
  created_at: "",
  updated_at: "",
};

beforeEach(() => {
  updates.length = 0;
  slotFull = false;
});

describe("recordCapturedPayment", () => {
  it("refuses a payment for less than the order amount", async () => {
    await expect(recordCapturedPayment(payment, "pay_1", 100, "upi")).rejects.toThrow(/Amount mismatch/);
    expect(updates).toHaveLength(0);
  });

  it("marks the payment captured and confirms only a booking still waiting for payment", async () => {
    await recordCapturedPayment(payment, "pay_1", 360000, "upi");

    const [paymentUpdate, bookingUpdate] = updates;
    expect(paymentUpdate.table).toBe("payments");
    expect(paymentUpdate.values).toMatchObject({ status: "captured", razorpay_payment_id: "pay_1" });
    expect(paymentUpdate.filters).toContainEqual(["neq", "status", "captured"]);

    expect(bookingUpdate.table).toBe("bookings");
    expect(bookingUpdate.values).toEqual({ status: "confirmed" });
    // A booking the owner already cancelled must stay cancelled.
    expect(bookingUpdate.filters).toContainEqual(["eq", "status", "pending_payment"]);
  });

  it("cancels instead of overbooking when the room was taken after the hold lapsed", async () => {
    slotFull = true;
    await recordCapturedPayment(payment, "pay_1", 360000, "upi");

    const [paymentUpdate, confirmAttempt, cancel] = updates;
    expect(paymentUpdate.values).toMatchObject({ status: "captured" });
    expect(confirmAttempt.values).toEqual({ status: "confirmed" });
    // The money is recorded; the booking shows as "paid, refund due".
    expect(cancel.table).toBe("bookings");
    expect(cancel.values).toEqual({ status: "cancelled" });
    expect(cancel.filters).toContainEqual(["eq", "status", "pending_payment"]);
  });

  it("is idempotent: an already-captured payment isn't written again", async () => {
    await recordCapturedPayment({ ...payment, status: "captured" }, "pay_1", 360000, "upi");
    expect(updates.map((u) => u.table)).toEqual(["bookings"]);
  });
});
