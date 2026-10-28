"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { GUEST_LANGUAGES, useGuestLanguage, type GuestLanguage } from "@/lib/guestLanguage";
import { GENERAL_NOTES, getTherapyDetail } from "@/lib/therapyDetails";
import FallbackImage from "@/components/ui/FallbackImage";

interface AIWellnessDoctorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrescription: (therapyId: string) => void;
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
  bestFor: string;
}

const COPY: Record<
  GuestLanguage,
  {
    openers: string[];
    greeting: string;
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    titleEnd: string;
    thinking: string;
    prescribed: string;
    bookThis: string;
    whatHappens: string;
    placeholder: string;
    disclaimer: string;
    error: string;
    close: string;
  }
> = {
  en: {
    openers: [
      "My neck and shoulders are stiff from desk work",
      "I have about an hour and want to switch off",
      "Something for my partner and me",
      "My feet ache from standing all day",
    ],
    greeting: "Tell me where it hurts, or what you'd like out of the hour — I'll pick the therapy that fits.",
    eyebrow: "Wellness consultant",
    titleStart: "What should we ",
    titleAccent: "treat",
    titleEnd: " today?",
    thinking: "Thinking",
    prescribed: "Prescribed",
    bookThis: "Book this",
    whatHappens: "What happens in your session",
    placeholder: "Type what's bothering you…",
    disclaimer: "Suggestions only — not medical advice",
    error: "Couldn't reach the consultant. Check your connection and try again.",
    close: "Close",
  },
  hi: {
    openers: [
      "डेस्क जॉब से गर्दन और कंधे अकड़ गए हैं",
      "मेरे पास एक घंटा है, बस आराम चाहिए",
      "मेरे और मेरे पार्टनर के लिए कुछ",
      "दिन भर खड़े रहने से पैरों में दर्द है",
    ],
    greeting: "बताइए दर्द कहाँ है, या इस घंटे में आप क्या चाहते हैं — मैं आपके लिए सही थेरेपी चुनूँगी।",
    eyebrow: "वेलनेस कंसल्टेंट",
    titleStart: "आज हम क्या ",
    titleAccent: "ठीक",
    titleEnd: " करें?",
    thinking: "सोच रही हूँ",
    prescribed: "आपके लिए सुझाव",
    bookThis: "बुक करें",
    whatHappens: "आपके सेशन में क्या होता है",
    placeholder: "बताइए क्या परेशानी है…",
    disclaimer: "सिर्फ सुझाव — यह मेडिकल सलाह नहीं है",
    error: "कंसल्टेंट से कनेक्ट नहीं हो पाया। इंटरनेट चेक करके फिर से कोशिश करें।",
    close: "बंद करें",
  },
  mr: {
    openers: [
      "डेस्क जॉबमुळे मान आणि खांदे आखडले आहेत",
      "माझ्याकडे एक तास आहे, फक्त आराम हवा आहे",
      "माझ्यासाठी आणि माझ्या पार्टनरसाठी काहीतरी",
      "दिवसभर उभं राहून पाय दुखतात",
    ],
    greeting: "सांगा कुठे दुखतंय, किंवा या तासात तुम्हाला काय हवंय — मी तुमच्यासाठी योग्य थेरपी निवडेन.",
    eyebrow: "वेलनेस कन्सल्टंट",
    titleStart: "आज आपण काय ",
    titleAccent: "बरं",
    titleEnd: " करूया?",
    thinking: "विचार करत आहे",
    prescribed: "तुमच्यासाठी सुचवलेले",
    bookThis: "बुक करा",
    whatHappens: "तुमच्या सेशनमध्ये काय होतं",
    placeholder: "काय त्रास होतोय ते सांगा…",
    disclaimer: "फक्त सूचना — हा वैद्यकीय सल्ला नाही",
    error: "कन्सल्टंटशी कनेक्ट होऊ शकले नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.",
    close: "बंद करा",
  },
};

export default function AIWellnessDoctor({
  isOpen,
  onClose,
  onApplyPrescription,
}: AIWellnessDoctorProps) {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useGuestLanguage();
  const copy = COPY[language];
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(COPY.en.openers);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // A fresh consultation each time it opens — nobody wants to resume a
  // conversation they had a week ago about a different shoulder.
  // Changing language mid-chat starts over, so the answers never mix two.
  useEffect(() => {
    setTurns([]);
    setError("");
    setSuggestions(COPY[language].openers);
    setRecommendation(null);
  }, [language]);

  useEffect(() => {
    if (!isOpen) return;
    setTurns([]);
    setDraft("");
    setError("");
    setThinking(false);
    setSuggestions(COPY[language].openers);
    setRecommendation(null);

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
        body: JSON.stringify({ messages: next, language }),
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
      }
    } catch {
      setError(copy.error);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      data-lenis-prevent
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
              {copy.eyebrow}
            </span>
            <h2 className="font-serif text-2xl font-light text-[#f7f4ee] sm:text-3xl">
              {copy.titleStart}
              <span className="italic text-[#c5a880]">{copy.titleAccent}</span>
              {copy.titleEnd}
            </h2>
            <div className="flex items-center gap-1.5 pt-2" role="group" aria-label="Language">
              {GUEST_LANGUAGES.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setLanguage(option.id)}
                  aria-pressed={language === option.id}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 font-sans text-xs transition-all ${
                    language === option.id
                      ? "bg-[#c5a880] font-bold text-[#07090b]"
                      : "border border-white/[0.12] text-[#e8ded2]/70 hover:border-[#c5a880]/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={copy.close}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] text-[#e8ded2] transition-all hover:bg-[#c5a880] hover:text-[#07090b]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* transcript */}
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-7 sm:px-9">
          <p className="max-w-[46ch] font-sans text-base leading-relaxed text-[#f0e9df]/80">
            {copy.greeting}
          </p>

          {turns.map((turn, index) => (
            <div
              key={index}
              className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <p
                className={`max-w-[46ch] whitespace-pre-line font-sans text-base leading-relaxed ${
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
              {copy.thinking}
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
              <FallbackImage
                src={recommendation.image}
                alt=""
                width={80}
                height={80}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#d9bb8e]">
                  {copy.prescribed}
                </span>
                <span className="mt-1 block font-serif text-xl text-[#f7f4ee]">
                  {recommendation.title}
                </span>
                <span className="mt-1 block font-mono text-[12px] text-[#e8ded2]/55">
                  {recommendation.duration} · {recommendation.pressure} · {recommendation.bestFor}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-xl text-[#c5a880]">{recommendation.price}</span>
                <button
                  onClick={() => {
                    onApplyPrescription(recommendation.id);
                    onClose();
                  }}
                  className="cursor-pointer whitespace-nowrap rounded-full bg-[#c5a880] px-7 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#07090b] transition-all hover:brightness-110"
                >
                  {copy.bookThis}
                </button>
              </div>
            </div>
          )}

          {recommendation &&
            (() => {
              const detail = getTherapyDetail(recommendation.id, language);
              if (!detail) return null;
              return (
                <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="font-sans text-sm leading-relaxed text-[#e8ded2]/85">{detail.about}</p>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#d9bb8e]">
                    {copy.whatHappens}
                  </span>
                  <ol className="space-y-2">
                    {detail.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3 font-sans text-sm leading-relaxed text-[#f7f4ee]/90">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c5a880]/50 font-mono text-[10px] text-[#c5a880]">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="border-t border-white/[0.08] pt-3 font-sans text-xs leading-relaxed text-[#e8ded2]/60">
                    {GENERAL_NOTES[language][0]}
                  </p>
                </div>
              );
            })()}
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
              placeholder={copy.placeholder}
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
            {copy.disclaimer}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
