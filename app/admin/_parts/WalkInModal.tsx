"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { BRANCH_LIST, MAX_DAYS_AHEAD, SLOT_TIMES, formatSlot, slotFits, type BranchId } from "@/lib/branches";
import { COMPLETE_SPA_DATA } from "@/lib/treatments";
import { addDays, indiaToday, rupees } from "./shared";

const ERRORS: Record<string, string> = {
  INVALID_PHONE: "Enter a 10-digit mobile number.",
  INVALID_NAME: "Enter the guest's name.",
  INVALID_SLOT: "That therapy doesn't finish before closing at this time.",
  INVALID_DATE: "Pick a date from today up to two months ahead.",
  SLOT_FULL: "All rooms are taken at that time.",
};

/** The owner enters a booking taken by phone or at the desk. Saved as confirmed, pay at spa. */
export default function WalkInModal({
  defaultBranch,
  onClose,
  onCreated,
}: {
  defaultBranch: BranchId;
  onClose: () => void;
  onCreated: (reference: string) => void;
}) {
  const today = indiaToday();
  const [branch, setBranch] = useState<BranchId>(defaultBranch);
  const [therapyId, setTherapyId] = useState(COMPLETE_SPA_DATA[0].id);
  const therapy = COMPLETE_SPA_DATA.find((t) => t.id === therapyId) ?? COMPLETE_SPA_DATA[0];
  const [minutes, setMinutes] = useState(therapy.options[0].minutes);
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [therapistPref, setTherapistPref] = useState<"any" | "female" | "male">("any");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const option = therapy.options.find((o) => o.minutes === minutes) ?? therapy.options[0];
  const slots = useMemo(() => SLOT_TIMES.filter((s) => slotFits(s, option.minutes, branch)), [option.minutes, branch]);

  useEffect(() => {
    if (!therapy.options.some((o) => o.minutes === minutes)) setMinutes(therapy.options[0].minutes);
  }, [therapy, minutes]);
  useEffect(() => {
    if (slot && !slots.includes(slot)) setSlot("");
  }, [slots, slot]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slot) {
      setError("Pick a time.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, therapyId, minutes: option.minutes, date, slot, name, phone, notes, therapistPref }),
      });
      if (response.status === 401) {
        window.location.replace("/admin/login");
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(ERRORS[data.error] ?? "Couldn't save the booking. Please try again.");
        return;
      }
      onCreated(data.reference);
    } catch {
      setError("Couldn't save the booking. Please try again.");
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
      aria-labelledby="walkin-title"
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-2xl animate-fadeIn space-y-5 overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0c1015] p-6 shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 id="walkin-title" className="flex items-center gap-2.5 font-serif text-2xl">
            <UserPlus className="h-5 w-5 text-[#c5a880]" /> New booking
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-full p-2 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="-mt-3 text-sm text-neutral-400">For a phone call or a walk-in. Saved as confirmed, payment at the spa.</p>

        <div className="grid grid-cols-2 gap-2">
          {BRANCH_LIST.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBranch(b.id)}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                branch === b.id ? "border-[#c5a880] bg-[#c5a880]/15 text-[#f0dfc2]" : "border-white/10 text-neutral-300 hover:border-white/25"
              }`}
            >
              {b.city}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Therapy</span>
            <select value={therapyId} onChange={(e) => setTherapyId(e.target.value)} className={field}>
              {COMPLETE_SPA_DATA.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0c1015]">
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Length</span>
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={field}>
              {therapy.options.map((o) => (
                <option key={o.minutes} value={o.minutes} className="bg-[#0c1015]">
                  {o.minutes} min · {rupees(o.price)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Date</span>
            <input type="date" value={date} min={today} max={addDays(today, MAX_DAYS_AHEAD)} onChange={(e) => setDate(e.target.value || today)} className={`${field} [color-scheme:dark]`} />
          </label>
          <div>
            <span className={label}>Time</span>
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`cursor-pointer rounded-lg border py-2 font-mono text-[11px] transition-colors ${
                    slot === s ? "border-[#c5a880] bg-[#c5a880] font-bold text-[#07090b]" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  {formatSlot(s).replace(" ", "")}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className={label}>Guest name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className={field} placeholder="Full name" />
          </label>
          <label className="block">
            <span className={label}>Mobile</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="numeric" className={field} placeholder="10-digit number" />
          </label>
          <label className="block">
            <span className={label}>Therapist</span>
            <select value={therapistPref} onChange={(e) => setTherapistPref(e.target.value as typeof therapistPref)} className={field}>
              <option value="any" className="bg-[#0c1015]">Any</option>
              <option value="female" className="bg-[#0c1015]">Female</option>
              <option value="male" className="bg-[#0c1015]">Male</option>
            </select>
          </label>
          <label className="block">
            <span className={label}>Note (optional)</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className={field} placeholder="Pressure, allergies…" />
          </label>
        </div>

        {error && <p className="rounded-xl border border-[#e0785e]/30 bg-[#e0785e]/10 px-3.5 py-2.5 text-sm text-[#e0785e]">{error}</p>}

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
          <span className="font-serif text-2xl text-[#d9bb8e]">{rupees(option.price)}</span>
          <button
            type="submit"
            disabled={busy}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-[#c5a880] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#07090b] hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save booking
          </button>
        </div>
      </form>
    </div>
  );
}
