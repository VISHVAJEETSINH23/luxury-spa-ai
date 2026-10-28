"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, CheckCircle2, Clock, CreditCard, Loader2, MapPin, MessageCircle, Store, X } from "lucide-react";
import { COMPLETE_SPA_DATA, formatRupees } from "@/lib/treatments";
import {
  BRANCHES,
  BRANCH_LIST,
  MAX_DAYS_AHEAD,
  SLOT_TIMES,
  formatSlot,
  minutesOfDay,
  slotFits,
  type BranchId,
} from "@/lib/branches";
import { createBooking, fetchPaymentOptions, openCheckout, verifyPayment, type CheckoutDetails } from "@/lib/bookings";
import FallbackImage from "@/components/ui/FallbackImage";
import { readSelectedBranch, setSelectedBranch } from "@/lib/selectedBranch";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExperience?: string;
  /** A length the guest was already pointed to (e.g. 90 min from the body map). */
  initialMinutes?: number;
}

type Step = "branch" | "therapy" | "when" | "details";

const STEP_LABELS: Record<Step, string> = {
  branch: "Branch",
  therapy: "Therapy",
  when: "When",
  details: "You",
};

const THERAPIST_PREFS = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "any", label: "No preference" },
] as const;


/** What the server's error codes mean to a guest. */
const ERROR_TEXT: Record<string, string> = {
  INVALID_DATE: "Please pick a date within the next two months.",
  INVALID_SLOT: "That time doesn't fit this therapy before closing. Pick an earlier slot.",
  SLOT_IN_PAST: "That time has passed or is too soon. Pick a later slot.",
  INVALID_NAME: "Please enter your name.",
  INVALID_PHONE: "Enter a valid 10-digit mobile number.",
  INVALID_EMAIL: "That email doesn't look right.",
  CONSENT_REQUIRED: "Please tick the box to agree before booking.",
  ONLINE_PAYMENT_UNAVAILABLE: "Online payment isn't available for this branch yet. Choose “Pay at spa”.",
  TOO_MANY_OPEN_BOOKINGS: "This number already has open booking requests. Please call or WhatsApp the spa.",
  SLOT_FULL: "All rooms are booked at that time. Please pick another slot or branch.",
  TOO_MANY_REQUESTS: "Too many attempts. Please wait a few minutes.",
  PAYMENT_START_FAILED: "We couldn't start the payment. Try again, or choose “Pay at spa”.",
  NETWORK: "No internet connection. Check it and try again.",
};

function indiaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function indiaMinuteOfDay(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function prettyDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

type Outcome =
  | { kind: "paid"; reference: string }
  | { kind: "requested"; reference: string }
  | { kind: "unpaid"; reference: string; payment: CheckoutDetails; message: string };

export default function ReservationModal({ isOpen, onClose, initialExperience, initialMinutes }: ReservationModalProps) {
  const [mounted, setMounted] = useState(false);

  const [branch, setBranch] = useState<BranchId | null>(null);
  const [therapyId, setTherapyId] = useState(COMPLETE_SPA_DATA[0].id);
  const [minutes, setMinutes] = useState(COMPLETE_SPA_DATA[0].options[0].minutes);
  const [date, setDate] = useState(indiaToday());
  const [slot, setSlot] = useState<string | null>(null);
  const [therapistPref, setTherapistPref] = useState<"female" | "male" | "any">("any");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<"online" | "at_spa">("online");
  const [consent, setConsent] = useState(false);
  const [onlineAvailable, setOnlineAvailable] = useState<Record<BranchId, boolean>>({ sangli: false, karad: false });

  const [step, setStep] = useState<Step>("branch");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [serverDown, setServerDown] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; slot?: string }>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => setMounted(true), []);

  const therapy = useMemo(
    () => COMPLETE_SPA_DATA.find((t) => t.id === therapyId) ?? COMPLETE_SPA_DATA[0],
    [therapyId]
  );
  const option = therapy.options.find((o) => o.minutes === minutes) ?? therapy.options[0];
  const price = option.price;

  const today = indiaToday();
  const availableSlots = useMemo(() => {
    const nowMinute = date === today ? indiaMinuteOfDay() + 30 : -1;
    return SLOT_TIMES.filter(
      (s) => (!branch || slotFits(s, option.minutes, branch)) && minutesOfDay(s) >= nowMinute
    );
  }, [date, today, option.minutes, branch]);

  // A slot that no longer fits (new date, longer therapy) is dropped.
  useEffect(() => {
    if (slot && !availableSlots.includes(slot)) setSlot(null);
  }, [availableSlots, slot]);

  // Late in the day nothing is left today: start the guest on tomorrow
  // instead of showing an empty list.
  const [todayIsOver, setTodayIsOver] = useState(false);
  useEffect(() => {
    if (branch && date === today && availableSlots.length === 0) {
      setTodayIsOver(true);
      setDate(addDays(today, 1));
    }
  }, [branch, date, today, availableSlots.length]);

  const selectTherapy = (id: string) => {
    const next = COMPLETE_SPA_DATA.find((t) => t.id === id);
    if (!next) return;
    setTherapyId(id);
    setMinutes(next.options[0].minutes);
  };

  const arrivedWithTherapy = !!initialExperience && COMPLETE_SPA_DATA.some((t) => t.id === initialExperience);
  const steps: Step[] = useMemo(
    () => (arrivedWithTherapy ? ["branch", "when", "details"] : ["branch", "therapy", "when", "details"]),
    [arrivedWithTherapy]
  );

  // Every open starts a fresh request; the branch the guest used last time is
  // remembered (it's not personal data), everything else is not.
  useEffect(() => {
    if (!isOpen) return;
    setOutcome(null);
    setFormError("");
    setServerDown(false);
    setErrors({});
    setConsent(false);
    setDate(indiaToday());
    setTodayIsOver(false);
    setSlot(null);
    if (arrivedWithTherapy) {
      selectTherapy(initialExperience!);
      const arrived = COMPLETE_SPA_DATA.find((t) => t.id === initialExperience);
      if (initialMinutes && arrived?.options.some((o) => o.minutes === initialMinutes)) setMinutes(initialMinutes);
    }
    setBranch(readSelectedBranch());
    setStep("branch");
    void fetchPaymentOptions().then(setOnlineAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialExperience, initialMinutes]);

  useEffect(() => {
    if (branch && !onlineAvailable[branch]) setPaymentMode("at_spa");
    else if (branch && onlineAvailable[branch]) setPaymentMode("online");
  }, [branch, onlineAvailable]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, busy]);

  const activeStepIndex = Math.max(0, steps.indexOf(step));
  const isLastStep = activeStepIndex === steps.length - 1;

  const chooseBranch = (id: BranchId) => {
    setBranch(id);
    setSelectedBranch(id);
    setStep(steps[1]);
  };

  const goBack = () => {
    if (activeStepIndex > 0) setStep(steps[activeStepIndex - 1]);
  };

  const goNext = () => {
    setFormError("");
    setServerDown(false);
    if (step === "branch" && !branch) return;
    if (step === "when" && !slot) {
      setErrors({ slot: "Pick a time." });
      return;
    }
    if (!isLastStep) {
      setErrors({});
      setStep(steps[activeStepIndex + 1]);
      return;
    }
    void submit();
  };

  const payNow = async (reference: string, payment: CheckoutDetails) => {
    const result = await openCheckout(payment, reference);
    if (result === "unavailable") {
      setOutcome({ kind: "unpaid", reference, payment, message: "The payment window couldn't open. Check your connection and try again." });
      return;
    }
    if (result === "dismissed") {
      setOutcome({ kind: "unpaid", reference, payment, message: "Payment wasn't completed. You can try again now — this booking stays open for 30 minutes." });
      return;
    }
    const verified = await verifyPayment({ reference, ...result });
    if (verified.ok) {
      setOutcome({ kind: "paid", reference });
    } else {
      // The webhook will still confirm it if the money did arrive.
      setOutcome({
        kind: "unpaid",
        reference,
        payment,
        message:
          "We couldn't confirm the payment yet. If money was deducted, your booking will be confirmed automatically — keep your reference.",
      });
    }
  };

  const submit = async () => {
    if (busy || !branch || !slot) return;
    const nextErrors: typeof errors = {};
    if (!guestName.trim()) nextErrors.name = "We need a name for the booking.";
    if (!/^[6-9]\d{9}$/.test(guestPhone)) nextErrors.phone = "Enter a 10-digit mobile number.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (!consent) {
      setFormError(ERROR_TEXT.CONSENT_REQUIRED);
      return;
    }

    setBusy(true);
    setFormError("");
    setServerDown(false);
    try {
      const result = await createBooking({
        branch,
        therapyId: therapy.id,
        minutes: option.minutes,
        date,
        slot,
        name: guestName.trim(),
        phone: guestPhone,
        email: guestEmail.trim(),
        notes: guestNotes.trim(),
        therapistPref,
        paymentMode,
        consent,
      });

      if (!result.ok) {
        const down = !ERROR_TEXT[result.error];
        setServerDown(down);
        setFormError(
          down
            ? "Online booking isn't working right now. Send your booking on WhatsApp — the details are filled in for you."
            : ERROR_TEXT[result.error]
        );
        return;
      }

      if (result.payment) await payNow(result.reference, result.payment);
      else setOutcome({ kind: "requested", reference: result.reference });
    } finally {
      setBusy(false);
    }
  };

  const retryPayment = async () => {
    if (outcome?.kind !== "unpaid" || busy) return;
    setBusy(true);
    try {
      await payNow(outcome.reference, outcome.payment);
    } finally {
      setBusy(false);
    }
  };

  const branchInfo = branch ? BRANCHES[branch] : null;

  const openWhatsApp = (reference: string) => {
    if (!branchInfo?.whatsapp) return;
    const text =
      `Hi ${branchInfo.name}, my booking reference is ${reference}.\n` +
      `${therapy.title} · ${option.minutes} min\n${prettyDate(date)} at ${slot ? formatSlot(slot) : ""}`;
    window.open(`https://wa.me/91${branchInfo.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  /** Fallback when the booking server can't be reached: the same request, by WhatsApp. */
  const bookOnWhatsApp = () => {
    if (!branchInfo?.whatsapp) return;
    const text = [
      `Hi ${branchInfo.name}, I'd like to book:`,
      `${therapy.title} · ${option.minutes} min (${formatRupees(price)})`,
      `${prettyDate(date)} at ${slot ? formatSlot(slot) : ""}`,
      `Name: ${guestName.trim()}`,
      `Phone: ${guestPhone}`,
      ...(therapistPref !== "any" ? [`Therapist: ${therapistPref}`] : []),
      ...(guestNotes.trim() ? [`Note: ${guestNotes.trim()}`] : []),
    ].join("\n");
    window.open(`https://wa.me/91${branchInfo.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  if (!isOpen || !mounted) return null;

  const fieldClass =
    "w-full bg-transparent border-b border-white/[0.16] px-0 py-4 text-lg text-[#f7f4ee] placeholder:text-[#e8ded2]/25 focus:outline-none focus:border-[#c5a880] transition-colors";
  const labelClass = "mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50";
  const headingClass = "max-w-[20ch] text-[2.1rem] sm:text-[3.1rem] font-serif font-light leading-[1.06] text-[#f7f4ee]";
  const choiceClass = (active: boolean) =>
    `cursor-pointer border-b py-4 text-center transition-all ${
      active ? "border-[#c5a880] text-[#f7f4ee]" : "border-white/[0.1] text-[#e8ded2]/60 hover:text-[#f7f4ee]"
    }`;

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[115] bg-[#07090b]/92 backdrop-blur-2xl flex items-stretch sm:items-center justify-center sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Book an appointment"
    >
      <div className="relative w-full max-w-[1100px] h-full sm:h-auto sm:min-h-[640px] sm:max-h-[92vh] bg-[#0a0907] sm:rounded-[28px] border-0 sm:border border-white/[0.08] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#07090b]/80 border border-white/12 flex items-center justify-center text-[#e8ded2] hover:bg-[#c5a880] hover:text-[#07090b] transition-all cursor-pointer disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        {outcome ? (
          /* ---------------- result ---------------- */
          <div className="flex flex-1 flex-col items-center justify-center text-center gap-6 p-8 sm:p-14 overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/40 flex items-center justify-center">
              {outcome.kind === "unpaid" ? (
                <CreditCard className="w-7 h-7 text-[#c5a880]" />
              ) : (
                <CheckCircle2 className="w-7 h-7 text-[#c5a880]" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#f7f4ee]">
                {outcome.kind === "paid" && (
                  <>
                    Booking <span className="italic text-[#c5a880]">confirmed</span>
                  </>
                )}
                {outcome.kind === "requested" && (
                  <>
                    Request <span className="italic text-[#c5a880]">received</span>
                  </>
                )}
                {outcome.kind === "unpaid" && (
                  <>
                    Payment <span className="italic text-[#c5a880]">pending</span>
                  </>
                )}
              </h2>
              <p className="text-base font-sans text-[#f0e9df]/80 max-w-md leading-relaxed">
                {outcome.kind === "paid" &&
                  `Paid ${formatRupees(price)} online. See you at ${branchInfo?.name}.`}
                {outcome.kind === "requested" &&
                  `${branchInfo?.name} will call or WhatsApp you to confirm the slot. You pay ${formatRupees(price)} at the spa.`}
                {outcome.kind === "unpaid" && outcome.message}
              </p>
            </div>

            <div className="px-7 py-4 border-y border-[#c5a880]/25">
              <span className="block text-[9px] font-mono uppercase tracking-[0.24em] text-[#e8ded2]/45">Reference</span>
              <span className="block font-mono text-2xl font-medium text-[#c5a880] tracking-[0.16em]">
                {outcome.reference}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-10 gap-y-3 text-left text-sm">
              {[
                ["Branch", branchInfo?.city ?? ""],
                ["Therapy", `${therapy.title} · ${option.minutes} min`],
                ["When", `${prettyDate(date)} · ${slot ? formatSlot(slot) : ""}`],
                [outcome.kind === "paid" ? "Paid" : "Amount", formatRupees(price)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#e8ded2]/40">{label}</dt>
                  <dd className="font-sans text-[#f7f4ee]">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              {outcome.kind === "unpaid" ? (
                <button
                  onClick={() => void retryPayment()}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#c5a880] text-[#07090b] text-[11px] font-sans font-bold tracking-[0.2em] uppercase hover:brightness-110 transition-all cursor-pointer disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Pay {formatRupees(price)}
                </button>
              ) : (
                branchInfo?.whatsapp && (
                  <button
                    onClick={() => openWhatsApp(outcome.reference)}
                    className="flex-1 flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#25D366] text-[#07090b] text-[11px] font-sans font-bold tracking-[0.2em] uppercase hover:brightness-110 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp the spa
                  </button>
                )
              )}
              <button
                onClick={onClose}
                disabled={busy}
                className="px-8 py-4 rounded-full border border-white/[0.14] text-[#e8ded2]/70 text-[11px] font-sans tracking-[0.22em] uppercase hover:text-[#c5a880] hover:border-[#c5a880]/60 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            {/* progress rail */}
            <header className="flex items-center justify-between gap-6 px-7 pb-6 pt-7 sm:px-14 sm:pt-9 lg:px-20">
              <div className="flex items-center gap-3">
                {steps.map((id, index) => {
                  const state = index === activeStepIndex ? "on" : index < activeStepIndex ? "done" : "todo";
                  return (
                    <div key={id} className="flex items-center gap-3">
                      {index > 0 && <span className="hidden sm:block h-px w-6 bg-white/[0.14]" />}
                      <button
                        type="button"
                        onClick={() => index < activeStepIndex && setStep(steps[index])}
                        disabled={index >= activeStepIndex}
                        className={`flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors ${
                          state === "on"
                            ? "text-[#c5a880]"
                            : state === "done"
                              ? "text-[#e8ded2]/55 hover:text-[#c5a880] cursor-pointer"
                              : "text-[#e8ded2]/30"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${state === "todo" ? "bg-white/20" : "bg-[#c5a880]"}`} />
                        <span className="hidden sm:inline">{STEP_LABELS[id]}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/40">
                Step 0{activeStepIndex + 1} / 0{steps.length}
              </span>
            </header>

            <div className="flex min-h-0 flex-1 flex-col justify-center gap-10 overflow-y-auto px-7 pb-8 sm:px-14 lg:px-20">
              {step === "branch" && (
                <>
                  <h2 className={headingClass}>
                    Which <span className="italic text-[#c5a880]">branch</span>?
                  </h2>
                  <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
                    {BRANCH_LIST.map((b) => {
                      const active = branch === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => chooseBranch(b.id)}
                          aria-pressed={active}
                          className={`cursor-pointer rounded-2xl border p-6 text-left transition-all ${
                            active ? "border-[#c5a880] bg-[#c5a880]/[0.08]" : "border-white/[0.1] hover:border-[#c5a880]/50"
                          }`}
                        >
                          <MapPin className="mb-3 h-5 w-5 text-[#c5a880]" />
                          <span className="block font-serif text-2xl text-[#f7f4ee]">{b.city}</span>
                          <span className="mt-1 block font-sans text-sm text-[#e8ded2]/55">{b.address ?? b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === "therapy" && (
                <>
                  <h2 className={headingClass}>
                    What are we <span className="italic text-[#c5a880]">treating</span> today?
                  </h2>
                  <div className="-mx-1 max-h-[48vh] max-w-4xl overflow-y-auto px-1">
                    {COMPLETE_SPA_DATA.map((item) => {
                      const isActive = item.id === therapy.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            selectTherapy(item.id);
                            setStep("when");
                          }}
                          aria-pressed={isActive}
                          className={`group flex w-full cursor-pointer items-center gap-4 border-b border-white/[0.08] py-4 pr-2 text-left transition-all duration-500 ${
                            isActive ? "pl-3 bg-[#c5a880]/[0.06]" : "hover:pl-2 hover:bg-white/[0.02]"
                          }`}
                        >
                          <FallbackImage
                            src={item.image}
                            alt=""
                            width={56}
                            height={56}
                            draggable={false}
                            className={`h-14 w-14 shrink-0 rounded-lg object-cover transition-all duration-500 ${
                              isActive ? "" : "grayscale-[40%] group-hover:grayscale-0"
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className={`block font-serif text-base leading-snug ${isActive ? "text-[#c5a880]" : "text-[#f7f4ee]"}`}>
                              {item.title}
                            </span>
                            <span className="line-clamp-1 block font-sans text-[12px] text-[#e8ded2]/55">{item.subtitle}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-mono text-base font-medium tabular-nums text-[#c5a880]">{item.price}</span>
                            <span className="block font-mono text-[10px] text-[#e8ded2]/40">{item.duration}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === "when" && (
                <>
                  <h2 className={headingClass}>
                    When suits <span className="italic text-[#c5a880]">you</span>?
                  </h2>

                  <div>
                    <span className={labelClass}>
                      <Clock className="h-3.5 w-3.5 text-[#c5a880]" /> Duration
                      {therapy.forTwo && <span className="text-[#c5a880]/70">· price for two</span>}
                    </span>
                    <div className="flex max-w-3xl flex-wrap gap-x-6 gap-y-2">
                      {therapy.options.map((o) => (
                        <button
                          key={o.minutes}
                          type="button"
                          onClick={() => setMinutes(o.minutes)}
                          aria-pressed={o.minutes === option.minutes}
                          className={`min-w-[7.5rem] ${choiceClass(o.minutes === option.minutes)}`}
                        >
                          <span className="block font-mono text-base tabular-nums">{o.minutes} min</span>
                          <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-[#c5a880]/80">
                            {formatRupees(o.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block max-w-sm">
                    <span className={labelClass}>
                      <Calendar className="h-3.5 w-3.5 text-[#c5a880]" /> Date
                    </span>
                    <input
                      type="date"
                      value={date}
                      min={today}
                      max={addDays(today, MAX_DAYS_AHEAD)}
                      onChange={(event) => setDate(event.target.value || today)}
                      className={`${fieldClass} [color-scheme:dark]`}
                    />
                  </label>

                  <div>
                    <span className={labelClass}>
                      <Clock className="h-3.5 w-3.5 text-[#c5a880]" /> Time
                    </span>
                    {todayIsOver && date === addDays(today, 1) && (
                      <p className="mb-3 font-sans text-sm text-[#c5a880]">
                        Today&apos;s slots are over — showing tomorrow, {prettyDate(date)}.
                      </p>
                    )}
                    {availableSlots.length === 0 ? (
                      <p className="font-sans text-sm text-[#e8ded2]/60">
                        No slots left on this date.{" "}
                        <button
                          type="button"
                          onClick={() => setDate(addDays(date, 1))}
                          className="cursor-pointer text-[#c5a880] underline underline-offset-4"
                        >
                          See the next day
                        </button>
                      </p>
                    ) : (
                      <div className="grid max-w-3xl grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                        {availableSlots.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSlot(s);
                              setErrors({});
                            }}
                            aria-pressed={s === slot}
                            className={choiceClass(s === slot)}
                          >
                            <span className="block font-mono text-base tabular-nums">{formatSlot(s)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.slot && <span className="mt-2 block text-[12px] text-[#e0785e]">{errors.slot}</span>}
                  </div>
                </>
              )}

              {step === "details" && (
                <>
                  <h2 className={headingClass}>
                    Who should we keep the room <span className="italic text-[#c5a880]">for</span>?
                  </h2>

                  <div className="grid max-w-4xl gap-x-12 gap-y-8 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Full name</span>
                      <input
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        value={guestName}
                        onChange={(event) => setGuestName(event.target.value)}
                        placeholder="Priya Patil"
                        className={fieldClass}
                      />
                      {errors.name && <span className="mt-1.5 block text-[11px] text-[#e0785e]">{errors.name}</span>}
                    </label>

                    <label className="block">
                      <span className={labelClass}>Mobile</span>
                      <div
                        className={`flex items-center border-b transition-colors focus-within:border-[#c5a880] ${
                          errors.phone ? "border-[#e0785e]/60" : "border-white/[0.14]"
                        }`}
                      >
                        <span className="pr-2.5 font-mono text-base text-[#e8ded2]/45">+91</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          value={guestPhone}
                          onChange={(event) => setGuestPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="98XXXXXXXX"
                          className="w-full bg-transparent py-3 text-base text-[#f7f4ee] placeholder:text-[#e8ded2]/25 focus:outline-none"
                        />
                      </div>
                      {errors.phone && <span className="mt-1.5 block text-[11px] text-[#e0785e]">{errors.phone}</span>}
                    </label>

                    <label className="block">
                      <span className={labelClass}>
                        Email <span className="text-[#e8ded2]/30">(optional)</span>
                      </span>
                      <input
                        type="email"
                        autoComplete="email"
                        maxLength={120}
                        value={guestEmail}
                        onChange={(event) => setGuestEmail(event.target.value)}
                        placeholder="you@example.com"
                        className={fieldClass}
                      />
                    </label>

                    <div>
                      <span className={labelClass}>Therapist</span>
                      <div className="flex gap-4">
                        {THERAPIST_PREFS.map((pref) => (
                          <button
                            key={pref.id}
                            type="button"
                            onClick={() => setTherapistPref(pref.id)}
                            aria-pressed={therapistPref === pref.id}
                            className={`flex-1 font-sans text-[15px] ${choiceClass(therapistPref === pref.id)}`}
                          >
                            {pref.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block sm:col-span-2">
                      <span className={labelClass}>
                        Anything we should know? <span className="text-[#e8ded2]/30">(optional)</span>
                      </span>
                      <input
                        type="text"
                        maxLength={500}
                        value={guestNotes}
                        onChange={(event) => setGuestNotes(event.target.value)}
                        placeholder="Injuries, allergies, pressure preference…"
                        className={fieldClass}
                      />
                    </label>

                    <div className="sm:col-span-2">
                      <span className={labelClass}>How would you like to pay?</span>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            ["online", CreditCard, "Pay online now", "UPI, cards, netbanking — booking confirmed instantly"],
                            ["at_spa", Store, "Pay at the spa", "The spa calls or WhatsApps you to confirm"],
                          ] as const
                        ).map(([mode, Icon, title, sub]) => {
                          const disabled = mode === "online" && !!branch && !onlineAvailable[branch];
                          const active = paymentMode === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              disabled={disabled}
                              onClick={() => setPaymentMode(mode)}
                              aria-pressed={active}
                              className={`cursor-pointer rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                                active ? "border-[#c5a880] bg-[#c5a880]/[0.08]" : "border-white/[0.1] hover:border-[#c5a880]/50"
                              }`}
                            >
                              <span className="flex items-center gap-2 font-sans text-[15px] text-[#f7f4ee]">
                                <Icon className="h-4 w-4 text-[#c5a880]" /> {title}
                              </span>
                              <span className="mt-1 block font-sans text-[12px] text-[#e8ded2]/55">
                                {disabled ? "Not available for this branch yet" : sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(event) => setConsent(event.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#c5a880]"
                      />
                      <span className="font-sans text-[13px] leading-relaxed text-[#e8ded2]/70">
                        I agree that Alexa Salon & Spa may use my name and mobile number to manage this booking and contact me
                        about it, as described in the{" "}
                        <a href="/privacy" target="_blank" className="text-[#c5a880] underline">
                          privacy policy
                        </a>
                        . I accept the{" "}
                        <a href="/refund-policy" target="_blank" className="text-[#c5a880] underline">
                          cancellation policy
                        </a>
                        .
                      </span>
                    </label>
                  </div>

                  {formError && (
                    <div className="max-w-2xl space-y-3 border-l border-[#e0785e]/60 pl-4">
                      <p className="font-sans text-sm text-[#e0785e]">{formError}</p>
                      {serverDown && branchInfo?.whatsapp && (
                        <button
                          type="button"
                          onClick={bookOnWhatsApp}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-sans text-sm font-semibold text-white"
                        >
                          <MessageCircle className="h-4 w-4" /> Book on WhatsApp instead
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-5 border-t border-white/[0.09] px-7 py-6 sm:px-14 lg:px-20">
              <div className="flex min-w-0 items-center gap-4">
                {activeStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={busy}
                    className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-[#e8ded2]/50 transition-colors hover:text-[#c5a880] cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
                <div className="min-w-0">
                  <span className="block truncate font-serif text-lg text-[#f7f4ee]">{therapy.title}</span>
                  <span className="block font-mono text-[11px] uppercase tracking-wider text-[#e8ded2]/45">
                    {branchInfo ? `${branchInfo.city} · ` : ""}
                    {prettyDate(date)}
                    {slot ? ` · ${formatSlot(slot)}` : ""} · {option.minutes} min
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#e8ded2]/45">Total</span>
                  <span className="block font-mono text-2xl font-medium tabular-nums text-[#c5a880]">{formatRupees(price)}</span>
                </div>

                {step !== "branch" && (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={busy}
                    className="flex shrink-0 items-center gap-2 rounded-full bg-[#c5a880] px-8 py-4 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-[#07090b] transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Please wait…
                      </>
                    ) : isLastStep ? (
                      paymentMode === "online" ? `Pay ${formatRupees(price)}` : "Request booking"
                    ) : (
                      "Continue →"
                    )}
                  </button>
                )}
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
