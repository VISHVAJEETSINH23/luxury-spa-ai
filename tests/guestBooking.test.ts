import { describe, expect, it } from "vitest";
import { guestCancelRule } from "@/lib/server/guestBooking";
import { retentionCutoff } from "@/lib/server/retention";
import { CANCEL_HOURS } from "@/lib/branches";

const start = Date.parse("2026-11-02T14:00:00+05:30");
const hours = (h: number) => h * 3_600_000;

function booking(overrides: Record<string, string> = {}) {
  return {
    status: "confirmed" as const,
    payment_mode: "at_spa" as const,
    booking_date: "2026-11-02",
    slot_time: "14:00:00",
    ...overrides,
  } as Parameters<typeof guestCancelRule>[0];
}

describe("guestCancelRule", () => {
  it("lets a pay-at-spa booking be cancelled right up to its start", () => {
    expect(guestCancelRule(booking(), start - 60_000)).toEqual({ ok: true });
    expect(guestCancelRule(booking({ status: "pending_confirmation" }), start - 60_000)).toEqual({ ok: true });
  });

  it("refuses once the appointment has started", () => {
    expect(guestCancelRule(booking(), start)).toEqual({ ok: false, reason: "STARTED" });
  });

  it(`holds a paid booking to the ${CANCEL_HOURS}-hour refund window`, () => {
    const paid = booking({ payment_mode: "online" });
    expect(guestCancelRule(paid, start - hours(CANCEL_HOURS) - 60_000)).toEqual({ ok: true });
    expect(guestCancelRule(paid, start - hours(CANCEL_HOURS) + 60_000)).toEqual({ ok: false, reason: "TOO_LATE_FOR_REFUND" });
  });

  it("refuses bookings that are already closed", () => {
    expect(guestCancelRule(booking({ status: "cancelled" }), 0)).toEqual({ ok: false, reason: "NOT_ACTIVE" });
    expect(guestCancelRule(booking({ status: "completed" }), 0)).toEqual({ ok: false, reason: "NOT_ACTIVE" });
  });
});

describe("retentionCutoff", () => {
  it("is the same day, the given number of months back", () => {
    expect(retentionCutoff("2026-10-29", 24)).toBe("2024-10-29");
    expect(retentionCutoff("2026-03-15", 1)).toBe("2026-02-15");
  });
});
