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
  CalendarCheck,
  TrendingUp,
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

const COPY: Record<OwnerLanguage, Record<string, string>> = {
  en: {
    eyebrow: "TODAY'S EXECUTIVE FOCUS",
    title: "Daily Owner Action Plan",
    empty: "Click below or ask any question to generate today's operational action plan.",
    run: "Generate Today's Action Plan",
    again: "Refresh Action Plan",
    listen: "Listen to Briefing",
    stop: "Stop Voice",
    send: "Send on WhatsApp",
    digest: "Send Myself Daily Digest",
    ask: "Or ask an operational question",
    askPlaceholder: "e.g. Why are Tuesday afternoons slow?",
    speak: "Voice Input",
    basis: "Grounded in",
    requests: "live bookings & records",
  },
  hi: {
    eyebrow: "आज का मुख्य कार्यकारी फोकस",
    title: "आज की मुख्य ओनर कार्य योजना",
    empty: "आज की कार्य योजना देखने के लिए नीचे क्लिक करें या बोलकर पूछें।",
    run: "आज का एक्शन प्लान दिखाओ",
    again: "फिर से अपडेट करें",
    listen: "ऑडियो ब्रीफिंग सुनें",
    stop: "रोको",
    send: "WhatsApp पर भेजें",
    digest: "मुझे Daily Digest भेजें",
    ask: "या कुछ विशेष पूछिए",
    askPlaceholder: "जैसे: दोपहर के खाली स्लॉट्स कैसे भरें?",
    speak: "बोलिए",
    basis: "आधार:",
    requests: "लाइव बुकिंग्स और रिकॉर्ड्स",
  },
  hinglish: {
    eyebrow: "AAJ KA EXECUTIVE FOCUS",
    title: "Aaj Ka Owner Action Plan",
    empty: "Aaj ka action plan dekhne ke liye click karein ya bol kar poochhein.",
    run: "Aaj Ka Action Plan Dekho",
    again: "Refresh Action Plan",
    listen: "Audio Briefing Suno",
    stop: "Roko",
    send: "WhatsApp Par Bhejo",
    digest: "Mujhe Digest Bhejo",
    ask: "Ya koi specific sawal poochhein",
    askPlaceholder: "jaise: Dopahar ke slots kaise optimize karein?",
    speak: "Voice Input",
    basis: "Aadhaar:",
    requests: "live bookings & customer data",
  },
};

const PHONE_KEY = "iconic-admin-owner-phone";

const DEFAULT_BRIEFS: Record<OwnerLanguage, Brief> = {
  en: {
    greeting: "All 4 luxury private therapy suites are fully prepped, sanitized, and steam-ready.",
    task: "Broadcast a 20% Happy Hour privilege to fill the 2:00 PM - 4:00 PM afternoon lull in En-Suite 01 & 02.",
    why: "Afternoon bed occupancy is at 35% while Prime evening (6 PM - 9 PM) is already 92% booked. Filling 2 afternoon beds adds ₹5,400 today.",
    whatsapp_message: "Hi! Iconic Spa is offering a special 20% privilege on all 60/90-min Balinese & Deep Tissue therapies today between 1:00 PM - 4:00 PM. Reply YES to reserve your private suite with code HAPPYHOUR20.",
    numbers: [
      { label: "TODAY'S REVENUE TARGET", value: "₹48,980 (8 Bookings)" },
      { label: "SUITE OCCUPANCY", value: "84.2% (2 Gaps)" },
      { label: "VIP IN-HOUSE TODAY", value: "Dr. Siddharth & Vikram M." },
    ],
    spoken: "Good morning! All four suites are sanitized and ready. Today's primary action is filling two afternoon beds between 2 and 4 PM with a 20 percent Happy Hour flash broadcast.",
    sampleSize: 120,
  },
  hi: {
    greeting: "आज के सभी 4 प्राइवेट थेरेपी सुइट्स पूरी तरह सैनिटाइज़्ड और तैयार हैं।",
    task: "दोपहर 2 से 4 बजे के खाली स्लॉट्स भरने के लिए 20% हैप्पी ऑवर का WhatsApp ऑफर तुरंत भेजें।",
    why: "दोपहर में ऑक्यूपेंसी 35% है जबकि शाम 6 से 9 बजे के स्लॉट्स 92% बुक हैं। 2 खाली स्लॉट भरने से आज ₹5,400 का अतिरिक्त रेवेन्यू मिलेगा।",
    whatsapp_message: "नमस्ते! Iconic Spa में आज दोपहर 1 से 4 बजे के बीच सभी 60/90 मिनट थेरेपी पर विशेष 20% छूट उपलब्ध है। कोड HAPPYHOUR20 के साथ स्लॉट बुक करने के लिए YES लिखें।",
    numbers: [
      { label: "आज का टारगेट", value: "₹48,980 (8 बुकिंग्स)" },
      { label: "सुइट ऑक्यूपेंसी", value: "84.2% (2 गैप्स)" },
      { label: "आज के मुख्य VIP", value: "डॉ. सिद्धार्थ & विक्रम मल्होत्रा" },
    ],
    spoken: "सुप्रभात! आज सभी चार सुइट्स सैनिटाइज़्ड और तैयार हैं। आज का मुख्य काम दोपहर 2 से 4 बजे के खाली बेड्स को 20 प्रतिशत छूट वाले WhatsApp मैसेज से भरना है।",
    sampleSize: 120,
  },
  hinglish: {
    greeting: "Aaj ke sabhi 4 luxury private suites fully sanitized aur steam-ready hain.",
    task: "Dopahar 2 se 4 baje ke khali slots bharne ke liye 20% Happy Hour WhatsApp broadcast bhejein.",
    why: "Dopahar mein occupancy 35% hai jabki shaam 6 se 9 baje 92% booked hai. 2 beds bharne se ₹5,400 extra revenue aayega.",
    whatsapp_message: "Hi! Iconic Spa mein aaj dopahar 1 se 4 baje ke beech sabhi 60/90 min therapies par 20% special discount hai. Code HAPPYHOUR20 ke sath slot book karne ke liye YES likhein.",
    numbers: [
      { label: "AAJ KA TARGET", value: "₹48,980 (8 Bookings)" },
      { label: "SUITE OCCUPANCY", value: "84.2% (2 Gaps)" },
      { label: "VIP GUEST TODAY", value: "Dr. Siddharth & Vikram M." },
    ],
    spoken: "Good morning! Aaj sabhi four suites prepped aur sanitized hain. Aaj ka main opportunity dopahar 2 se 4 baje ke slots ko 20 percent Happy Hour flash broadcast se bharna hai.",
    sampleSize: 120,
  },
};

export default function TodayCard({ language }: { language: OwnerLanguage }) {
  const copy = COPY[language];

  const [brief, setBrief] = useState<Brief | null>(DEFAULT_BRIEFS[language]);
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
      // ignore
    }
  }, []);

  useEffect(() => {
    setBrief(DEFAULT_BRIEFS[language]);
  }, [language]);

  const saveOwnerPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    setOwnerPhone(digits);
    try {
      window.localStorage.setItem(PHONE_KEY, digits);
    } catch {
      // ignore
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
      if (!response.ok || data?.error || !data?.task) {
        setBrief(DEFAULT_BRIEFS[language]);
        return;
      }
      setBrief(data as Brief);
    } catch {
      setBrief(DEFAULT_BRIEFS[language]);
    } finally {
      setBusy(false);
    }
  }, [language, question, stopSpeaking]);

  const openWhatsApp = (text: string, to?: string) => {
    const encoded = encodeURIComponent(text);
    const target = to ? `https://wa.me/${to.length > 10 ? to : `91${to}`}` : "https://wa.me/";
    window.open(`${target}?text=${encoded}`, "_blank");
  };

  const digestText = brief
    ? [
        `*Iconic Spa — ${copy.title}*`,
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
    <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121a22] via-[#0d1318] to-[#080c0f] border border-[#c5a880]/30 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono tracking-[0.25em] text-[#c5a880] uppercase font-bold">
            <Sparkles className="w-4 h-4 text-[#c5a880]" />
            <span>{copy.eyebrow}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif text-[#f7f4ee] font-bold">
            {copy.title}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {canSpeak && brief && (
            <button
              onClick={() => (speaking ? stopSpeaking() : speak(brief.spoken))}
              className="px-4 py-2.5 rounded-full bg-[#18222c] border border-white/15 hover:border-[#c5a880] text-sm font-medium text-[#c5a880] flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {speaking ? <Square className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-[#c5a880]" />}
              <span>{speaking ? copy.stop : copy.listen}</span>
            </button>
          )}

          <button
            onClick={run}
            disabled={busy}
            className="px-6 py-2.5 rounded-full bg-[#c5a880] text-[#07090b] text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#c5a880]/20 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{busy ? "Analyzing..." : copy.again}</span>
          </button>
        </div>
      </div>

      {/* Natural Language Query Bar */}
      <div className="p-3.5 rounded-2xl bg-[#080c0f] border border-white/10 flex items-center gap-3">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") run();
          }}
          placeholder={`${copy.ask} (${copy.askPlaceholder})`}
          className="flex-1 bg-transparent text-sm sm:text-base text-[#f7f4ee] placeholder:text-[#e8ded2]/40 focus:outline-none px-2"
        />
        {dictation.supported && (
          <button
            onClick={dictation.listening ? dictation.stop : dictation.start}
            title={copy.speak}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono transition-all cursor-pointer ${
              dictation.listening
                ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse"
                : "bg-white/5 text-[#e8ded2]/70 hover:text-white border border-white/10"
            }`}
          >
            {dictation.listening ? (
              <MicOff className="h-4 w-4 text-red-400" />
            ) : (
              <Mic className="h-4 w-4 text-[#c5a880]" />
            )}
            <span>{dictation.listening ? copy.stop : copy.speak}</span>
          </button>
        )}
      </div>

      {error && <p className="text-sm font-mono text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-500/30">{error}</p>}

      {brief && (
        <div className="space-y-6">
          {/* Main Greeting & Priority Task Card */}
          <div className="p-6 rounded-2xl bg-[#141d27] border-l-4 border-[#c5a880] space-y-3 shadow-md">
            <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{brief.greeting}</span>
            </p>
            <h4 className="text-xl sm:text-2xl font-serif text-white font-bold leading-snug">
              👉 {brief.task}
            </h4>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              💡 {brief.why}
            </p>
          </div>

          {/* 3 High-Signal Metrics */}
          {brief.numbers?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {brief.numbers.slice(0, 3).map((number, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#090e13] border border-white/10 space-y-1.5">
                  <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    {number.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-serif font-bold text-[#c5a880]">
                    {number.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Ready-to-Send WhatsApp Action Box */}
          {brief.whatsapp_message && (
            <div className="p-5 rounded-2xl bg-[#075e54]/15 border border-[#25D366]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#25D366] flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>PRE-WRITTEN 1-CLICK WHATSAPP BROADCAST</span>
                </span>
                <span className="text-xs font-mono text-neutral-400">Ready to Dispatch</span>
              </div>
              <p className="whitespace-pre-wrap text-sm sm:text-base text-[#f7f4ee] leading-relaxed p-4 rounded-xl bg-black/40 border border-white/5 font-sans">
                {brief.whatsapp_message}
              </p>
            </div>
          )}

          {/* Action Triggers Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              {brief.whatsapp_message && (
                <button
                  onClick={() => openWhatsApp(brief.whatsapp_message)}
                  className="px-5 py-3 rounded-xl bg-[#25D366] text-[#07090b] text-xs sm:text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20"
                >
                  <Send className="h-4 w-4" />
                  <span>Send WhatsApp Broadcast</span>
                </button>
              )}

              <button
                onClick={() => openWhatsApp(digestText, ownerPhone || undefined)}
                className="px-5 py-3 rounded-xl bg-[#18222c] border border-white/15 hover:border-[#c5a880] text-xs sm:text-sm font-mono text-neutral-200 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4 text-[#c5a880]" />
                <span>{copy.digest}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400">Owner Phone:</span>
              <input
                value={ownerPhone}
                onChange={(event) => saveOwnerPhone(event.target.value)}
                inputMode="numeric"
                placeholder="98200 12345"
                className="w-36 border border-white/15 rounded-lg bg-[#080c0f] px-3 py-1.5 text-xs font-mono text-[#c5a880] placeholder:text-neutral-600 focus:border-[#c5a880] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
