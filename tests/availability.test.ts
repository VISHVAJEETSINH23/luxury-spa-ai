import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/supabase", () => ({ db: () => ({}) }));

const { fullSlots } = await import("@/lib/server/availability");

const NOW = Date.parse("2026-11-02T10:00:00+05:30");
const recent = new Date(NOW - 10 * 60_000).toISOString();
const old = new Date(NOW - 45 * 60_000).toISOString();

function booking(slot_time: string, minutes: number, status = "confirmed", created_at = recent) {
  return { slot_time, minutes, status, created_at };
}

describe("fullSlots", () => {
  it("marks a time full when every room overlaps it", () => {
    const taken = [booking("14:00:00", 60), booking("14:00:00", 90), booking("13:30:00", 60, "pending_confirmation")];
    expect(fullSlots(taken, 3, 60, "karad", NOW)).toEqual(["14:00"]);
  });

  it("doesn't count bookings that end exactly when the slot starts", () => {
    const taken = [booking("12:00:00", 120), booking("12:00:00", 120), booking("12:00:00", 120)];
    expect(fullSlots(taken, 3, 60, "karad", NOW)).toEqual(["12:00"]);
  });

  it("lets an unpaid online booking go after its 30-minute hold, like the database does", () => {
    const taken = [booking("14:00:00", 60), booking("14:00:00", 60), booking("14:00:00", 60, "pending_payment", old)];
    expect(fullSlots(taken, 3, 60, "karad", NOW)).toEqual([]);
    const held = [booking("14:00:00", 60), booking("14:00:00", 60), booking("14:00:00", 60, "pending_payment", recent)];
    expect(fullSlots(held, 3, 60, "karad", NOW)).toEqual(["14:00"]);
  });

  it("ignores cancelled and completed bookings", () => {
    const taken = [booking("14:00:00", 60, "cancelled"), booking("14:00:00", 60, "completed"), booking("14:00:00", 60)];
    expect(fullSlots(taken, 1, 60, "karad", NOW)).toEqual(["14:00"]);
    expect(fullSlots(taken, 2, 60, "karad", NOW)).toEqual([]);
  });
});
