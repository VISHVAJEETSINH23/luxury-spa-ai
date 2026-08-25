"use client";

import { useEffect, useRef, useState } from "react";
import { Palette as PaletteIcon, X } from "lucide-react";
import {
  DEFAULT_PALETTE_ID,
  DEFAULT_SPEED,
  PALETTES,
  readPaletteId,
  readSpeed,
  saveAmbience,
} from "@/lib/palettes";

/**
 * On-page control for the ambient background: colour and how fast it drifts.
 * The choice is kept in the browser, so it survives reloads on this device.
 * Flip this to false to take the control off the public site while keeping
 * whatever palette was last saved.
 */
const SHOW_SWITCHER = true;

export default function AmbienceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPaletteId(readPaletteId());
    setSpeed(readSpeed());
  }, []);

  // Escape closes; so does a click anywhere off the panel.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [isOpen]);

  if (!SHOW_SWITCHER) return null;

  const apply = (nextPalette: string, nextSpeed: number) => {
    setPaletteId(nextPalette);
    setSpeed(nextSpeed);
    saveAmbience(nextPalette, nextSpeed);
  };

  return (
    <div ref={panelRef} className="fixed bottom-6 left-6 z-40 select-none">
      {isOpen && (
        <div className="absolute bottom-14 left-0 w-72 rounded-2xl border border-[#c5a880]/25 bg-[#0b0f12]/95 backdrop-blur-2xl p-4 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#c5a880]">
              Ambience
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close ambience settings"
              className="text-[#e8ded2]/50 hover:text-[#f7f4ee] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <span className="block text-[9px] font-mono uppercase tracking-[0.2em] text-[#e8ded2]/40">
              Colour
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTES.map((palette) => {
                const isActive = palette.id === paletteId;
                return (
                  <button
                    key={palette.id}
                    onClick={() => apply(palette.id, speed)}
                    aria-pressed={isActive}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-[#c5a880] bg-[#c5a880]/10"
                        : "border-white/10 hover:border-[#c5a880]/40"
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-white/20"
                      style={{ background: palette.chip }}
                    />
                    <span
                      className={`text-[10px] font-sans leading-tight ${
                        isActive ? "text-[#f7f4ee]" : "text-[#e8ded2]/65"
                      }`}
                    >
                      {palette.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#e8ded2]/40">
                Motion
              </span>
              <span className="text-[10px] font-mono text-[#c5a880]">
                {speed === 0 ? "still" : speed.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={Math.round(speed * 100)}
              onChange={(event) => apply(paletteId, Number(event.target.value) / 100)}
              aria-label="Background motion speed"
              className="w-full h-[2px] appearance-none rounded-full bg-white/15 accent-[#c5a880] cursor-pointer"
            />
            <p className="text-[10px] font-sans text-[#e8ded2]/40 leading-relaxed">
              Drag to zero to hold the background completely still.
            </p>
          </div>

          <button
            onClick={() => apply(DEFAULT_PALETTE_ID, DEFAULT_SPEED)}
            className="w-full py-2 rounded-xl border border-white/10 text-[10px] font-mono uppercase tracking-widest text-[#e8ded2]/60 hover:text-[#f7f4ee] hover:border-white/25 transition-all cursor-pointer"
          >
            Reset to default
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Background colour and motion"
        title="Background colour and motion"
        className="w-11 h-11 rounded-full border border-[#c5a880]/35 bg-[#0b0f12]/80 backdrop-blur-xl flex items-center justify-center text-[#c5a880] hover:bg-[#c5a880] hover:text-[#07090b] transition-all shadow-xl cursor-pointer"
      >
        <PaletteIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
