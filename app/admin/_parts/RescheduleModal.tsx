"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, X } from "lucide-react";
import { BRANCHES, MAX_DAYS_AHEAD, SLOT_TIMES, formatSlot, slotFits } from "@/lib/branches";
import { fetchFullSlots } from "@/lib/bookings";
import { addDays, bookingWhatsapp, indiaToday, openMessageTab, prettyDate, slotLabel, type Booking } from "./shared";

const ERRORS: Record<string, string> = {
  INVALID_SLOT: "That therapy doesn't finish before closing at this time.",
  INVALID_DATE: "Pick a date from today up to two months ahead.",
  SLOT_FULL: "All rooms are taken at that time.",
  INVALID_TRANSITION: "This booking can't be moved any more.",
  CHANGED_MEANWHILE: "The booking changed meanwhile. Close and try again.",
};

/** The owner moves a booking to another date or time, then tells the guest on WhatsApp. */
export default function RescheduleModal({
  booking,
  onClose,
  onMoved,
}: {
  booking: Booking;
  onClose: () => void;
  onMoved: (moved: Booking) => void;
}) {
  const today = indiaToday();
  const [date, setDate] = useState(booking.booking_date < today ? today : booking.booking_date);
  const [slot, setSlot] = useState("");
  const [full, setFull] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const slots = useMemo(
    () => SLOT_TIMES.filter((s) => slotFits(s, booking.minutes, booking.branch)),
    [booking.minutes, booking.branch]
  );

  useEffect(() => {
    let current = true;
    setFull([]);
    void fetchFullSlots(booking.branch, date, booking.minutes).then((list) => current && setFull(list));
    return () => {
      current = false;
    };
  }, [booking.branch, booking.minutes, date]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const unchanged = date === booking.booking_date && slot === booking.slot_time.slice(0, 5);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slot) {
      setError("Pick a time.");
      return;
    }
    const message = openMessageTab();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/bookings/${booking.reference}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slot }),
      });
      if (response.status === 401) {
        message.cancel();
        window.location.replace("/admin/login");
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.ok) {
        message.cancel();
        setError(ERRORS[data.error] ?? "Couldn't move the booking. Please try again.");
        return;
      }
      const moved = { ...booking, booking_date: date, slot_time: slot };
      message.send(bookingWhatsapp(moved, { moved: true }));
      onMoved(moved);
    } catch {
      message.cancel();
      setError("Couldn't move the booking. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-[#f7f4ee] focus:border-[#c5a880]/60 focus:outline-none";
  const label = "mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-neutral-400";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-title"
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-lg animate-fadeIn space-y-5 overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0c1015] p-6 shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 id="move-title" className="flex items-center gap-2.5 font-serif text-2xl">
            <CalendarClock className="h-5 w-5 text-[#c5a880]" /> Move booking
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-full p-2 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="-mt-3 text-sm text-neutral-400">
          {booking.guest_name} · {booking.therapy_title} · {booking.minutes} min · {BRANCHES[booking.branch].city}
          <br />
          Now: {prettyDate(booking.booking_date)}, {slotLabel(booking)}
        </p>

        <label className="block">
          <span className={label}>New date</span>
          <input
            type="date"
            value={date}
            min={today}
            max={addDays(today, MAX_DAYS_AHEAD)}
            onChange={(e) => setDate(e.target.value || today)}
            className={`${field} [color-scheme:dark]`}
          />
        </label>

        <div>
          <span className={label}>New time</span>
          <div className="grid grid-cols-4 gap-1.5">
            {slots.map((s) => {
              const isFull = full.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`cursor-pointer rounded-lg border py-2 font-mono text-[11px] transition-colors ${
                    slot === s
                      ? "border-[#c5a880] bg-[#c5a880] font-bold text-[#07090b]"
                      : isFull
                        ? "border-[#e0785e]/30 text-[#e0785e]/70"
                        : "border-white/10 hover:border-white/25"
                  }`}
                >
                  {formatSlot(s).replace(" ", "")}
                  {isFull && <span className="block text-[9px] uppercase">Full</span>}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="rounded-xl border border-[#e0785e]/30 bg-[#e0785e]/10 px-3.5 py-2.5 text-sm text-[#e0785e]">{error}</p>}

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
          <span className="text-xs text-neutral-400">WhatsApp opens with the new time for the guest.</span>
          <button
            type="submit"
            disabled={busy || unchanged}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#c5a880] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#07090b] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Move
          </button>
        </div>
      </form>
    </div>
  );
}
