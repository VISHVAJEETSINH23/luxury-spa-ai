import { describe, expect, it } from "vitest";
import { parseBookingInput, indiaNow } from "@/lib/server/bookingInput";
import { COMPLETE_SPA_DATA } from "@/lib/treatments";
import { MAX_DAYS_AHEAD } from "@/lib/branches";

const therapy = COMPLETE_SPA_DATA.find((t) => t.options.some((o) => o.minutes <= 60))!;
const option = therapy.options.find((o) => o.minutes <= 60)!;

function daysFromToday(days: number): string {
  const d = new Date(`${indiaNow().date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function valid(overrides: Record<string, unknown> = {}) {
  return {
    branch: "karad",
    therapyId: therapy.id,
    minutes: option.minutes,
    date: daysFromToday(1),
    slot: "10:30",
    name: "Test Guest",
    phone: "9876543210",
    email: "guest@example.com",
    notes: "",
    therapistPref: "any",
    paymentMode: "at_spa",
    consent: true,
    ...overrides,
  };
}

describe("parseBookingInput", () => {
  it("accepts a well-formed booking", () => {
    const result = parseBookingInput(valid());
    expect(result.ok).toBe(true);
  });

  it("takes the price from the menu and ignores any amount the browser sends", () => {
    const result = parseBookingInput(valid({ amountInr: 1, price: 1 }));
    expect(result.ok && result.value.amountInr).toBe(option.price);
  });

  it("strips a +91 / 91 prefix from the phone", () => {
    const result = parseBookingInput(valid({ phone: "+91 98765 43210" }));
    expect(result.ok && result.value.phone).toBe("9876543210");
  });

  it.each([
    ["unknown branch", { branch: "pune" }, "INVALID_BRANCH"],
    ["unknown therapy", { therapyId: "nope" }, "INVALID_THERAPY"],
    ["length the therapy doesn't offer", { minutes: 7 }, "INVALID_THERAPY"],
    ["date in the past", { date: daysFromToday(-1) }, "INVALID_DATE"],
    ["date too far ahead", { date: daysFromToday(MAX_DAYS_AHEAD + 1) }, "INVALID_DATE"],
    ["slot not on the list", { slot: "11:11" }, "INVALID_SLOT"],
    ["slot that runs past Sangli's 8 PM close", { branch: "sangli", slot: "20:00" }, "INVALID_SLOT"],
    ["landline-looking phone", { phone: "0231234567" }, "INVALID_PHONE"],
    ["bad email", { email: "not-an-email" }, "INVALID_EMAIL"],
    ["missing consent", { consent: false }, "CONSENT_REQUIRED"],
    ["unknown payment mode", { paymentMode: "crypto" }, "INVALID_PAYMENT_MODE"],
    ["empty name", { name: "   " }, "INVALID_NAME"],
  ])("rejects %s", (_label, overrides, error) => {
    expect(parseBookingInput(valid(overrides))).toEqual({ ok: false, error });
  });

  it("rejects a non-object body", () => {
    expect(parseBookingInput(null)).toEqual({ ok: false, error: "BAD_REQUEST" });
  });

  it("removes control characters and caps notes at 500 chars", () => {
    const result = parseBookingInput(valid({ notes: "a\u0000b" + "x".repeat(600) }));
    expect(result.ok && result.value.notes?.startsWith("a b")).toBe(true);
    expect(result.ok && result.value.notes?.length).toBe(500);
  });
});
