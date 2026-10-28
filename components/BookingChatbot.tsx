"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Loader2, Send, Sparkles, X } from "lucide-react";
import { GUEST_LANGUAGES, useGuestLanguage, type GuestLanguage } from "@/lib/guestLanguage";
import { getTherapyDetail } from "@/lib/therapyDetails";
import { BRANCH_LIST } from "@/lib/branches";
import FallbackImage from "@/components/ui/FallbackImage";

/** Sit above the WhatsApp button when it is shown, in its place when it isn't. */
const POSITION = BRANCH_LIST.some((b) => b.whatsapp)
  ? "bottom-[5.25rem] sm:bottom-[6.25rem]"
  : "bottom-5 sm:bottom-6";

interface BookingChatbotProps {
  onBook: (therapyId: string) => void;
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
}

const COPY: Record<
  GuestLanguage,
  {
    greeting: string;
    openers: string[];
    tagline: string;
    typing: string;
    placeholder: string;
    bookNow: string;
    tooltip: string;
    error: string;
    whatHappens: string;
  }
> = {
  en: {
    greeting:
      "Hi! I'm Alexa, your booking assistant. Tell me what you're looking for and I'll find the right massage and book your slot.",
    openers: [
      "I want to book a massage today",
      "Couple massage for two",
      "My back and neck are stiff",
      "Show me the price list",
      "What happens in a massage?",
    ],
    tagline: "Finds & books your massage",
    typing: "Typing",
    placeholder: "Ask about massages, prices, slots…",
    bookNow: "Book now",
    tooltip: "Book with AI Assistant",
    error: "Couldn't reach the assistant. Check your connection and try again.",
    whatHappens: "What happens in this therapy?",
  },
  hi: {
    greeting:
      "नमस्ते! मैं Alexa हूँ, आपकी बुकिंग असिस्टेंट। बताइए आपको क्या चाहिए — मैं सही मसाज ढूँढकर आपका स्लॉट बुक कर दूँगी।",
    openers: [
      "आज मसाज बुक करनी है",
      "दो लोगों के लिए कपल मसाज",
      "पीठ और गर्दन में दर्द है",
      "रेट लिस्ट दिखाइए",
      "मसाज में क्या होता है?",
    ],
    tagline: "मसाज ढूँढे और बुक करे",
    typing: "लिख रही है",
    placeholder: "मसाज, रेट, स्लॉट के बारे में पूछें…",
    bookNow: "बुक करें",
    tooltip: "AI से बुक करें",
    error: "असिस्टेंट से कनेक्ट नहीं हो पाया। इंटरनेट चेक करके फिर से कोशिश करें।",
    whatHappens: "इस थेरेपी में क्या होता है?",
  },
  mr: {
    greeting:
      "नमस्कार! मी Alexa, तुमची बुकिंग असिस्टंट. तुम्हाला काय हवे ते सांगा — मी योग्य मसाज शोधून तुमचा स्लॉट बुक करेन.",
    openers: [
      "आज मसाज बुक करायचा आहे",
      "दोघांसाठी कपल मसाज",
      "पाठ आणि मान दुखते",
      "दरपत्रक दाखवा",
      "मसाजमध्ये काय होतं?",
    ],
    tagline: "मसाज शोधा आणि बुक करा",
    typing: "लिहित आहे",
    placeholder: "मसाज, दर, स्लॉटबद्दल विचारा…",
    bookNow: "बुक करा",
    tooltip: "AI सोबत बुक करा",
    error: "असिस्टंटशी कनेक्ट होऊ शकले नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.",
    whatHappens: "या थेरपीमध्ये काय होतं?",
  },
};

/** Fired when one floating widget opens so the other can close itself. */
export const FLOATING_OPEN_EVENT = "alexa:floating-open";

export default function BookingChatbot({ onBook }: BookingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useGuestLanguage();
  const [showSteps, setShowSteps] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(COPY.en.openers);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const copy = COPY[language];

  // A new language (picked here or anywhere else on the site) starts a fresh
  // chat, so the AI never answers in a mix of two.
  useEffect(() => {
    setTurns([]);
    setError("");
    setRecommendation(null);
    setShowSteps(false);
    setSuggestions(COPY[language].openers);
  }, [language]);

  useEffect(() => {
    const onOtherOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== "chatbot") setIsOpen(false);
    };
    window.addEventListener(FLOATING_OPEN_EVENT, onOtherOpen);
    return () => window.removeEventListener(FLOATING_OPEN_EVENT, onOtherOpen);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking, recommendation]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      window.dispatchEvent(new CustomEvent(FLOATING_OPEN_EVENT, { detail: "chatbot" }));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

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
        if (data.therapy.id !== recommendation?.id) setShowSteps(false);
        setRecommendation(data.therapy);
      }
    } catch {
      setError(copy.error);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const book = (therapyId?: string) => {
    onBook(therapyId ?? recommendation?.id ?? "");
    setIsOpen(false);
  };

  // "Book now" style follow-ups go straight to the reservation form.
  const handleSuggestion = (suggestion: string) => {
    if (recommendation && /\b(book|reserve)\b|बुक/i.test(suggestion)) {
      book();
      return;
    }
    send(suggestion);
  };

  return (
    <div className={`fixed ${POSITION} right-5 sm:right-6 z-50 select-none`}>
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI booking assistant"
          className="absolute bottom-16 right-0 flex h-[min(520px,calc(100dvh-11rem))] w-[calc(100vw-2.5rem)] max-w-[360px] flex-col overflow-hidden rounded-3xl border border-[#c5a880]/40 bg-[#0b0f12]/95 text-[#f7f4ee] shadow-2xl backdrop-blur-2xl animate-fadeIn"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#a8875a] to-[#d9bb8e] text-[#07090b] shadow-md shadow-[#c5a880]/30">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="flex items-center gap-1.5 font-serif text-xs font-bold tracking-wide">
                  ALEXA AI BOOKING
                </h4>
                <span className="flex items-center gap-1 font-mono text-[10px] text-[#d9bb8e]">
                  <Sparkles className="h-2.5 w-2.5" />
                  {copy.tagline}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close booking assistant"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/5 text-[#e8ded2]/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Language switcher */}
          <div className="flex shrink-0 items-center gap-1.5 border-b border-white/10 px-4 py-2">
            {GUEST_LANGUAGES.map((option) => (
              <button
                key={option.id}
                onClick={() => setLanguage(option.id)}
                aria-pressed={language === option.id}
                className={`cursor-pointer rounded-full px-3 py-1 font-sans text-[11px] transition-all ${
                  language === option.id
                    ? "bg-[#c5a880] font-bold text-[#07090b]"
                    : "border border-white/10 text-[#e8ded2]/70 hover:border-[#c5a880]/50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Transcript */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <p className="rounded-2xl rounded-bl-sm border border-white/5 bg-[#141b22] p-3 font-sans text-xs leading-relaxed text-[#e8ded2]/90">
              {copy.greeting}
            </p>

            {turns.map((turn, index) => (
              <div key={index} className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl p-3 font-sans text-xs leading-relaxed ${
                    turn.role === "user"
                      ? "rounded-br-sm bg-[#c5a880] text-[#07090b]"
                      : "rounded-bl-sm border border-white/5 bg-[#141b22] text-[#e8ded2]/90"
                  }`}
                >
                  {turn.content}
                </p>
              </div>
            ))}

            {thinking && (
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#e8ded2]/45">
                <Loader2 className="h-3 w-3 animate-spin" />
                {copy.typing}
              </p>
            )}

            {error && (
              <p className="border-l border-[#e0785e]/60 pl-3 font-sans text-xs text-[#e0785e]">{error}</p>
            )}

            {recommendation && !thinking && (
              <div className="rounded-2xl border border-[#c5a880]/30 bg-[#090d10] p-2.5">
                <div className="flex items-center gap-3">
                  <FallbackImage
                    src={recommendation.image}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-sm">{recommendation.title}</span>
                    <span className="block font-mono text-[10px] text-[#c5a880]">
                      {recommendation.price} · {recommendation.duration}
                    </span>
                  </div>
                  <button
                    onClick={() => book()}
                    className="shrink-0 cursor-pointer rounded-full bg-[#c5a880] px-3.5 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-[#07090b] transition-all hover:brightness-110"
                  >
                    {copy.bookNow}
                  </button>
                </div>

                {(() => {
                  const detail = getTherapyDetail(recommendation.id, language);
                  if (!detail) return null;
                  return (
                    <>
                      <button
                        onClick={() => setShowSteps((open) => !open)}
                        aria-expanded={showSteps}
                        className="mt-2.5 flex w-full cursor-pointer items-center justify-between border-t border-white/10 pt-2 text-left font-sans text-[11px] text-[#d9bb8e] hover:text-[#f7f4ee]"
                      >
                        {copy.whatHappens}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSteps ? "rotate-180" : ""}`} />
                      </button>
                      {showSteps && (
                        <div className="mt-2 space-y-2">
                          <p className="font-sans text-[11px] leading-relaxed text-[#e8ded2]/80">{detail.about}</p>
                          <ol className="space-y-1.5">
                            {detail.steps.map((step, index) => (
                              <li key={index} className="flex items-start gap-2 font-sans text-[11px] leading-relaxed text-[#f7f4ee]/90">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#c5a880]/50 font-mono text-[9px] text-[#c5a880]">
                                  {index + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Suggestions + input */}
          <div className="shrink-0 border-t border-white/10 px-4 py-3">
            {suggestions.length > 0 && !thinking && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestion(suggestion)}
                    className="cursor-pointer rounded-full border border-white/10 bg-[#090d10] px-3 py-1.5 font-sans text-[11px] text-[#e4d3ba] transition-all hover:border-[#c5a880]/50"
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
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={copy.placeholder}
                className="flex-1 rounded-full border border-white/10 bg-[#10151a] px-3.5 py-2 text-xs text-[#f7f4ee] placeholder-white/40 focus:border-[#c5a880] focus:outline-none"
              />
              <button
                type="submit"
                disabled={thinking || !draft.trim()}
                aria-label="Send"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#c5a880] text-[#07090b] shadow-md shadow-[#c5a880]/30 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating trigger */}
      <div className="group relative">
        <div className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-[#0b0f12]/95 px-3 py-1.5 font-sans text-xs font-medium text-[#f7f4ee] opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:opacity-100 sm:flex">
          <Sparkles className="h-3 w-3 text-[#c5a880]" />
          <span>{copy.tooltip}</span>
        </div>

        <button
          onClick={toggle}
          aria-label="AI booking assistant"
          aria-expanded={isOpen}
          className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-white/25 bg-gradient-to-tr from-[#a8875a] to-[#d9bb8e] text-[#07090b] shadow-xl shadow-[#c5a880]/40 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-[#c5a880]/60 active:scale-95 sm:h-14 sm:w-14"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6 sm:h-7 sm:w-7" />}
          {!isOpen && (
            <span className="absolute -right-0.5 -top-0.5 rounded-full border-2 border-[#07090b] bg-[#07090b] px-1 font-mono text-[8px] font-bold leading-tight text-[#d9bb8e]">
              AI
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
