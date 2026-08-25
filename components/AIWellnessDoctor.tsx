"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Send, Sparkles, X } from "lucide-react";

interface AIWellnessDoctorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrescription: (therapyId: string, promoCode: string) => void;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface Recommendation {
  id: string;
  title: string;
  price: string;
  duration: string;
  image: string;
  pressure: string;
  oil: string;
}

const OPENERS = [
  "My neck and shoulders are stiff from desk work",
  "I have about an hour and want to switch off",
  "Something for my partner and me",
  "My feet ache from standing all day",
];

const GREETING =
  "Tell me where it hurts, or what you'd like out of the hour — I'll pick the therapy that fits.";

export default function AIWellnessDoctor({
  isOpen,
  onClose,
  onApplyPrescription,
}: AIWellnessDoctorProps) {
  const [mounted, setMounted] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(OPENERS);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // A fresh consultation each time it opens — nobody wants to resume a
  // conversation they had a week ago about a different shoulder.
  useEffect(() => {
    if (!isOpen) return;
    setTurns([]);
    setDraft("");
    setError("");
    setThinking(false);
    setSuggestions(OPENERS);
    setRecommendation(null);
    setPromoCode(null);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking, recommendation]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || thinking) return;

    const next: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(next);
    setDraft("");
    setSuggestions([]);
    setError("");
    setThinking(true);

    try {
      const response = await fetch("/api/ai/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }

      setTurns([...next, { role: "assistant", content: data.reply }]);
      setSuggestions(data.followUp ?? []);
      if (data.therapy) {
        setRecommendation(data.therapy);
        setPromoCode(data.promoCode ?? null);
      }
    } catch {
      setError("Couldn't reach the consultant. Check your connection and try again.");
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-stretch justify-center bg-[#07090b]/92 backdrop-blur-2xl sm:items-center sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="AI wellness consultant"
    >
      <div className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden border-0 border-white/[0.08] bg-[#0a0907] sm:h-auto sm:max-h-[88vh] sm:rounded-[28px] sm:border">
        <header className="flex shrink-0 items-start justify-between gap-6 border-b border-white/[0.08] px-6 py-6 sm:px-9">
          <div className="space-y-1.5">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-[#d9bb8e]">
              <Sparkles className="h-3.5 w-3.5" />
              Wellness consultant
            </span>
            <h2 className="font-serif text-2xl font-light text-[#f7f4ee] sm:text-3xl">
              What should we <span className="italic text-[#c5a880]">treat</span> today?
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] text-[#e8ded2] transition-all hover:bg-[#c5a880] hover:text-[#07090b]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* transcript */}
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-7 sm:px-9">
          <p className="max-w-[46ch] font-sans text-base leading-relaxed text-[#f0e9df]/80">
            {GREETING}
          </p>

          {turns.map((turn, index) => (
            <div
              key={index}
              className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <p
                className={`max-w-[46ch] font-sans text-base leading-relaxed ${
                  turn.role === "user"
                    ? "rounded-2xl rounded-br-sm bg-[#c5a880] px-4 py-3 text-[#07090b]"
                    : "text-[#f0e9df]/90"
                }`}
              >
                {turn.content}
              </p>
            </div>
          ))}

          {thinking && (
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#e8ded2]/45">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking
            </p>
          )}

          {error && (
            <p className="border-l border-[#e0785e]/60 pl-4 font-sans text-sm text-[#e0785e]">
              {error}
            </p>
          )}

          {/* the prescription */}
          {recommendation && (
            <div className="mt-2 flex flex-col gap-4 border-t border-white/[0.09] pt-6 sm:flex-row sm:items-center">
              <img
                src={recommendation.image}
                alt=""
                onError={(event) => {
                  (event.target as HTMLImageElement).src = "/images/ritual-basalt.jpg";
                }}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#d9bb8e]">
                  Prescribed
                </span>
                <span className="mt-1 block font-serif text-xl text-[#f7f4ee]">
                  {recommendation.title}
                </span>
                <span className="mt-1 block font-mono text-[12px] text-[#e8ded2]/55">
                  {recommendation.duration} · {recommendation.pressure} · {recommendation.oil}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-xl text-[#c5a880]">{recommendation.price}</span>
                <button
                  onClick={() => {
                    onApplyPrescription(recommendation.id, promoCode ?? "AIWELLNESS20");
                    onClose();
                  }}
                  className="cursor-pointer whitespace-nowrap rounded-full bg-[#c5a880] px-7 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#07090b] transition-all hover:brightness-110"
                >
                  Book this
                </button>
              </div>
            </div>
          )}
        </div>

        {/* suggestions + input */}
        <div className="shrink-0 border-t border-white/[0.08] px-6 py-5 sm:px-9">
          {suggestions.length > 0 && !thinking && (
            <div className="mb-4 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  className="cursor-pointer rounded-full border border-white/[0.12] px-4 py-2 font-sans text-[13px] text-[#e8ded2]/70 transition-all hover:border-[#c5a880]/50 hover:text-[#f7f4ee]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="flex items-center gap-3 border-b border-white/[0.14] transition-colors focus-within:border-[#c5a880]"
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type what's bothering you…"
              className="w-full bg-transparent py-3.5 text-base text-[#f7f4ee] placeholder:text-[#e8ded2]/25 focus:outline-none"
            />
            <button
              type="submit"
              disabled={thinking || !draft.trim()}
              aria-label="Send"
              className="shrink-0 cursor-pointer p-2 text-[#c5a880] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#e8ded2]/35">
            Suggestions only — not medical advice
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
