"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, MapPin, MessageCircle, Phone } from "lucide-react";
import { BRANCHES, CANCEL_HOURS, formatSlot } from "@/lib/branches";
import { manageBooking, type GuestBooking } from "@/lib/bookings";
import { formatRupees } from "@/lib/treatments";

const STATUS_TEXT: Record<GuestBooking["status"], { label: string; detail: string; tone: string }> = {
  pending_confirmation: {
    label: "Waiting for the spa",
    detail: "The spa is checking the room and will WhatsApp you to confirm.",
    tone: "text-amber-300 border-amber-400/40 bg-amber-400/10",
  },
  pending_payment: {
    label: "Payment not finished",
    detail: "This booking isn't paid yet. Book again, or WhatsApp the spa.",
    tone: "text-sky-300 border-sky-400/40 bg-sky-400/10",
  },
  confirmed: { label: "Confirmed", detail: "Your room is booked. See you soon!", tone: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" },
  completed: { label: "Completed", detail: "Thank you for visiting.", tone: "text-[#d9bb8e] border-[#c5a880]/40 bg-[#c5a880]/10" },
  cancelled: { label: "Cancelled", detail: "This booking is cancelled.", tone: "text-[#e8ded2]/60 border-white/15 bg-white/5" },
};

const ERRORS: Record<string, string> = {
  NOT_FOUND: "No booking matches that reference and mobile number. Check both and try again.",
  TOO_MANY_REQUESTS: "Too many tries. Please wait a few minutes.",
  NETWORK: "No internet connection. Check it and try again.",
  STARTED: "This appointment has already started, so it can't be cancelled here.",
  TOO_LATE_FOR_REFUND: `Paid bookings can be cancelled online up to ${CANCEL_HOURS} hours before. Please call or WhatsApp the spa.`,
  NOT_ACTIVE: "This booking is already closed.",
  CHANGED_MEANWHILE: "The booking just changed. Look it up again.",
};

function prettyDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

/** A guest checks — and can cancel — their booking with its reference and mobile number. */
export default function ManageBooking() {
  const params = useSearchParams();
  const [reference, setReference] = useState((params.get("ref") ?? "").toUpperCase().slice(0, 10));
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<GuestBooking | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justCancelled, setJustCancelled] = useState(false);

  const run = async (action: "view" | "cancel") => {
    setBusy(true);
    setError("");
    try {
      const result = await manageBooking(action, reference, phone);
      if (result.ok) {
        setBooking(result.booking);
        setJustCancelled(action === "cancel");
      } else {
        setError(ERRORS[result.error] ?? "Something went wrong. Please try again, or call the spa.");
      }
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    if (!booking) return;
    const paidNote = booking.paid ? " The spa will refund your payment to the account you paid from." : "";
    if (window.confirm(`Cancel your ${booking.therapyTitle} on ${prettyDate(booking.date)} at ${formatSlot(booking.slot)}?${paidNote}`)) {
      void run("cancel");
    }
  };

  const branch = booking ? BRANCHES[booking.branch] : null;
  const status = booking ? STATUS_TEXT[booking.status] : null;
  const field =
    "w-full bg-transparent border-b border-white/[0.16] px-0 py-3 text-lg text-[#f7f4ee] placeholder:text-[#e8ded2]/25 focus:outline-none focus:border-[#c5a880] transition-colors";
  const label = "mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50";

  return (
    <main className="min-h-screen bg-[#07090b] px-5 py-16 text-[#f0e9df] sm:px-8">
      <div className="mx-auto max-w-xl space-y-8">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#c5a880] hover:underline">
          ← Alexa Salon & Spa
        </Link>
        <h1 className="font-serif text-4xl font-light text-[#f7f4ee] sm:text-5xl">
          Your <span className="italic text-[#c5a880]">booking</span>
        </h1>

        {!booking ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run("view");
            }}
            className="space-y-6"
          >
            <p className="font-sans text-sm text-[#e8ded2]/65">
              Enter the reference you got when booking (like SNG-4F2K9C) and the mobile number you booked with.
            </p>
            <label className="block">
              <span className={label}>Booking reference</span>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="SNG-4F2K9C"
                autoCapitalize="characters"
                required
                className={`${field} font-mono tracking-[0.12em]`}
              />
            </label>
            <label className="block">
              <span className={label}>Mobile number</span>
              <div className="flex items-center border-b border-white/[0.16] focus-within:border-[#c5a880]">
                <span className="pr-2.5 font-mono text-base text-[#e8ded2]/45">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98XXXXXXXX"
                  required
                  className="w-full bg-transparent py-3 text-lg text-[#f7f4ee] placeholder:text-[#e8ded2]/25 focus:outline-none"
                />
              </div>
            </label>
            {error && <p className="border-l border-[#e0785e]/60 pl-4 font-sans text-sm text-[#e0785e]">{error}</p>}
            <button
              type="submit"
              disabled={busy || phone.length !== 10 || reference.length < 10}
              className="flex items-center gap-2 rounded-full bg-[#c5a880] px-8 py-4 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-[#07090b] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Find my booking
            </button>
          </form>
        ) : (
          <section className="space-y-6">
            {justCancelled && (
              <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 font-sans text-sm text-emerald-300">
                Your booking is cancelled. The spa has been told.
                {booking.paid && " The spa will refund your payment to the account you paid from."}
              </p>
            )}

            <div className="space-y-5 rounded-3xl border border-white/10 bg-[#0c1015] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xl tracking-[0.14em] text-[#c5a880]">{booking.reference}</span>
                <span className={`rounded-full border px-3 py-1 font-sans text-xs ${status!.tone}`}>{status!.label}</span>
              </div>
              <p className="font-sans text-sm text-[#e8ded2]/70">{status!.detail}</p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {[
                  ["Name", booking.name],
                  ["Branch", branch!.city],
                  ["Therapy", `${booking.therapyTitle} · ${booking.minutes} min`],
                  ["When", `${prettyDate(booking.date)} · ${formatSlot(booking.slot)}`],
                  [booking.paid ? "Paid online" : "Pay at the spa", formatRupees(booking.amountInr)],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8ded2]/40">{term}</dt>
                    <dd className="font-sans text-[#f7f4ee]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-wrap gap-3">
              {branch!.whatsapp && (
                <a
                  href={`https://wa.me/91${branch!.whatsapp}?text=${encodeURIComponent(`Hi ${branch!.name}, about my booking ${booking.reference}:`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-sans text-sm font-semibold text-[#07090b]"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp the spa
                </a>
              )}
              {branch!.phone && (
                <a href={`tel:+91${branch!.phone}`} className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-sans text-sm">
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
              {branch!.mapsUrl && (
                <a
                  href={branch!.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-sans text-sm"
                >
                  <MapPin className="h-4 w-4" /> Directions
                </a>
              )}
            </div>

            {error && <p className="border-l border-[#e0785e]/60 pl-4 font-sans text-sm text-[#e0785e]">{error}</p>}

            {booking.canCancel ? (
              <div className="space-y-2 border-t border-white/[0.08] pt-6">
                <p className="font-sans text-xs text-[#e8ded2]/50">
                  Need to change the time? WhatsApp the spa. To cancel instead:
                </p>
                <button
                  onClick={cancel}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-full border border-[#e0785e]/50 px-6 py-3 font-sans text-sm font-semibold text-[#e0785e] transition-colors hover:bg-[#e0785e]/10 disabled:opacity-50 cursor-pointer"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Cancel this booking
                </button>
              </div>
            ) : (
              booking.cancelBlockedBy === "TOO_LATE_FOR_REFUND" && (
                <p className="font-sans text-xs text-[#e8ded2]/50">{ERRORS.TOO_LATE_FOR_REFUND}</p>
              )
            )}

            <button
              onClick={() => {
                setBooking(null);
                setJustCancelled(false);
                setError("");
              }}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#e8ded2]/50 hover:text-[#c5a880] cursor-pointer"
            >
              ← Look up another booking
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
