"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Star } from "lucide-react";
import { BRAND, BRANCH_LIST, branchHours, type BranchId } from "@/lib/branches";
import { readSelectedBranch, setSelectedBranch } from "@/lib/selectedBranch";

/**
 * First visit: the guest picks Sangli or Karad before anything else. The
 * choice is remembered, so returning guests go straight to the site; they can
 * switch any time from the gallery, the booking form or the WhatsApp button.
 */
export default function BranchGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readSelectedBranch()) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const choose = (id: BranchId) => {
    setSelectedBranch(id);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-gate-title"
      data-lenis-prevent
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[#07090b]/90 px-4 py-8 backdrop-blur-xl animate-fadeIn"
    >
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <span className="block font-mono text-[11px] uppercase tracking-[0.3em] text-[#d9bb8e]">{BRAND.fullName}</span>
          <h2 id="branch-gate-title" className="mt-3 font-serif text-3xl font-light uppercase text-[#f7f4ee] sm:text-5xl">
            Choose your <span className="italic text-[#c5a880]">branch</span>
          </h2>
          <p className="mt-3 font-sans text-sm text-[#e8ded2]/65">Same menu and prices at both. You can switch any time.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {BRANCH_LIST.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => choose(b.id)}
              className="group cursor-pointer rounded-3xl border border-white/[0.12] bg-[#0b0f12]/80 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-[#c5a880] hover:bg-[#c5a880]/[0.06] sm:p-7"
            >
              <MapPin className="mb-4 h-6 w-6 text-[#c5a880]" />
              <span className="block font-serif text-3xl text-[#f7f4ee]">{b.city}</span>
              {b.address && <span className="mt-2 block font-sans text-sm leading-relaxed text-[#e8ded2]/60">{b.address}</span>}
              <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#e8ded2]/70">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#c5a880]" /> {branchHours(b.id)}
                </span>
                {b.rating && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-[#c5a880] text-[#c5a880]" /> {b.rating.score.toFixed(1)} ({b.rating.count})
                  </span>
                )}
              </span>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c5a880] px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#07090b] transition-transform group-hover:translate-x-1">
                Visit {b.city} →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
