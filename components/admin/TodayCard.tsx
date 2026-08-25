"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";

import {
  type OwnerLanguage,
  useDictation,
  useSpeech,
} from "@/components/admin/OwnerVoice";

interface Brief {
  greeting: string;
  task: string;
  why: string;
  whatsapp_message: string;
  numbers: { label: string; value: string }[];
  spoken: string;
  sampleSize: number;
}

/** Every label on the card, in the owner's language. Small enough to keep here. */
const COPY: Record<OwnerLanguage, Record<string, string>> = {
  en: {
    eyebrow: "Today",
    title: "One thing to do today",
    empty: "Ask what today needs and the answer arrives in a few seconds.",
    run: "Show me today",
    again: "Check again",
    listen: "Listen",
    stop: "Stop",
    send: "Send on WhatsApp",
    digest: "Send myself the digest",
    ask: "Or ask something",
    askPlaceholder: "Why are Tuesdays empty?",
    speak: "Speak",
    basis: "Based on",
    requests: "booking requests",
  },
  hi: {
    eyebrow: "आज",
    title: "आज का एक काम",
    empty: "पूछिए कि आज क्या करना है — कुछ ही सेकंड में जवाब आ जाएगा।",
    run: "आज का काम दिखाओ",
    again: "फिर से देखो",
    listen: "सुनो",
    stop: "रोको",
    send: "WhatsApp पर भेजो",
    digest: "मुझे digest भेजो",
    ask: "या कुछ पूछिए",
    askPlaceholder: "मंगलवार खाली क्यों जाते हैं?",
    speak: "बोलिए",
    basis: "आधार:",
    requests: "booking requests",
  },
  hinglish: {
    eyebrow: "Aaj",
    title: "Aaj ka ek kaam",
    empty: "Poochho ki aaj kya karna hai — kuch second mein jawab aa jayega.",
    run: "Aaj ka kaam dikhao",
    again: "Phir se dekho",
    listen: "Suno",
    stop: "Roko",
    send: "WhatsApp pe bhejo",
    digest: "Mujhe digest bhejo",
    ask: "Ya kuch poochho",
    askPlaceholder: "Mangalwar khaali kyun ja rahe hain?",
    speak: "Boliye",
    basis: "Aadhaar:",
    requests: "booking requests",
  },
};

const PHONE_KEY = "alexa-admin-owner-phone";

/**
 * The morning brief.
 *
 * The full analysis on the marketing tab is a report, and a report is something
 * an owner reads on a quiet afternoon that never comes. This is the same data
 * reduced to one instruction, in their language, spoken aloud on request, with
 * the WhatsApp message already written — so acting on it costs a tap.
 */
export default function TodayCard({ language }: { language: OwnerLanguage }) {
  const copy = COPY[language];

  const [brief, setBrief] = useState<Brief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  const { speak, stop: stopSpeaking, speaking, supported: canSpeak } = useSpeech(language);
  const dictation = useDictation(language, setQuestion);

  useEffect(() => {
    try {
      setOwnerPhone(window.localStorage.getItem(PHONE_KEY) ?? "");
    } catch {
      // Fine — the field just starts empty.
    }
  }, []);

  const saveOwnerPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    setOwnerPhone(digits);
    try {
      window.localStorage.setItem(PHONE_KEY, digits);
    } catch {
      // Not worth surfacing.
    }
  };

  const run = useCallback(async () => {
    setBusy(true);
    setError("");
    stopSpeaking();
    try {
      const response = await fetch("/api/ai/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, question }),
      });
      const data = await response.json();
      if (!response.ok || data?.error) {
        setError(data?.error ?? "Couldn't put today's briefing together.");
        return;
      }
      setBrief(data as Brief);
    } catch {
      setError("Couldn't reach the assistant.");
    } finally {
      setBusy(false);
    }
  }, [language, question, stopSpeaking]);

  /* The brief was written in whatever language was set when it was generated,
     so switching language clears it rather than leaving a stale mismatch. */
  useEffect(() => {
    setBrief(null);
    stopSpeaking();
  }, [language, stopSpeaking]);

  const openWhatsApp = (text: string, to?: string) => {
    const target = to ? `https://wa.me/${to.length > 10 ? to : `91${to}`}` : "https://wa.me/";
    window.open(`${target}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const digestText = brief
    ? [
        `*Alexa Spa — ${copy.title}*`,
        "",
        brief.greeting,
        "",
        `👉 ${brief.task}`,
        brief.why,
        "",
        ...brief.numbers.map((n) => `• ${n.label}: ${n.value}`),
      ].join("\n")
    : "";

  return (
    <section className="border-y border-white/10 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-[0.35em] text-[#c5a880] uppercase">
            {copy.eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-serif tracking-wide text-[#f7f4ee]">{copy.title}</h3>
        </div>

        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-2 rounded-full border border-[#c5a880]/50 px-5 py-2.5 text-xs font-medium text-[#c5a880] transition-colors hover:bg-[#c5a880] hover:text-[#07090b] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : brief ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {brief ? copy.again : copy.run}
        </button>
      </div>

      {/* Ask in your own words — typed or spoken. */}
      <div className="mt-6 flex items-center gap-3 border-b border-white/10 pb-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") run();
          }}
          placeholder={`${copy.ask} — ${copy.askPlaceholder}`}
          className="flex-1 bg-transparent text-sm text-[#f7f4ee] placeholder:text-[#e8ded2]/35 focus:outline-none"
        />
        {dictation.supported && (
          <button
            onClick={dictation.listening ? dictation.stop : dictation.start}
            title={copy.speak}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-mono transition-colors ${
              dictation.listening
                ? "bg-red-500/20 text-red-300"
                : "text-[#e8ded2]/60 hover:text-[#c5a880]"
            }`}
          >
            {dictation.listening ? (
              <MicOff className="h-3.5 w-3.5" />
            ) : (
              <Mic className="h-3.5 w-3.5" />
            )}
            {dictation.listening ? copy.stop : copy.speak}
          </button>
        )}
      </div>

      {error && <p className="mt-5 text-sm text-red-300/90">{error}</p>}

      {!brief && !error && (
        <p className="mt-6 text-sm leading-relaxed text-[#e8ded2]/50">{copy.empty}</p>
      )}

      {brief && (
        <div className="mt-8 space-y-8 animate-fadeIn">
          <p className="text-sm text-[#e8ded2]/70">{brief.greeting}</p>

          <div className="border-l-2 border-[#c5a880] pl-5">
            <p className="text-xl leading-snug text-[#f7f4ee] sm:text-2xl">{brief.task}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#e8ded2]/60">{brief.why}</p>
          </div>

          {brief.numbers?.length > 0 && (
            <div className="grid gap-px border-y border-white/10 sm:grid-cols-3">
              {brief.numbers.slice(0, 3).map((number) => (
                <div key={number.label} className="py-4 sm:px-5 sm:first:pl-0">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e8ded2]/45">
                    {number.label}
                  </p>
                  <p className="mt-1.5 text-lg text-[#f7f4ee]">{number.value}</p>
                </div>
              ))}
            </div>
          )}

          {brief.whatsapp_message && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e8ded2]/45">
                WhatsApp
              </p>
              <p className="mt-3 max-w-md whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-[#075e54]/25 px-4 py-3 text-sm leading-relaxed text-[#f7f4ee]">
                {brief.whatsapp_message}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {canSpeak && (
              <button
                onClick={() => (speaking ? stopSpeaking() : speak(brief.spoken))}
                className="flex items-center gap-2 text-xs text-[#c5a880] transition-opacity hover:opacity-70"
              >
                {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-4 w-4" />}
                {speaking ? copy.stop : copy.listen}
              </button>
            )}

            {brief.whatsapp_message && (
              <button
                onClick={() => openWhatsApp(brief.whatsapp_message)}
                className="flex items-center gap-2 text-xs text-[#e8ded2]/70 transition-colors hover:text-[#f7f4ee]"
              >
                <Send className="h-3.5 w-3.5" />
                {copy.send}
              </button>
            )}

            <button
              onClick={() => openWhatsApp(digestText, ownerPhone || undefined)}
              className="flex items-center gap-2 text-xs text-[#e8ded2]/70 transition-colors hover:text-[#f7f4ee]"
            >
              <Send className="h-3.5 w-3.5" />
              {copy.digest}
            </button>

            <input
              value={ownerPhone}
              onChange={(event) => saveOwnerPhone(event.target.value)}
              inputMode="numeric"
              placeholder="98200 12345"
              className="w-32 border-b border-white/10 bg-transparent pb-1 text-xs text-[#e8ded2]/70 placeholder:text-[#e8ded2]/25 focus:border-[#c5a880] focus:outline-none"
            />
          </div>

          <p className="text-[10px] font-mono text-[#e8ded2]/35">
            {copy.basis} {brief.sampleSize} {copy.requests}
          </p>
        </div>
      )}
    </section>
  );
}
