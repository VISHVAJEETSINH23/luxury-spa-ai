"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type OwnerLanguage = "en" | "hi" | "hinglish";

export const LANGUAGE_LABELS: { id: OwnerLanguage; label: string; hint: string }[] = [
  { id: "en", label: "English", hint: "Plain English" },
  { id: "hi", label: "हिंदी", hint: "देवनागरी में" },
  { id: "hinglish", label: "Hinglish", hint: "WhatsApp jaisa" },
];

const STORAGE_KEY = "alexa-admin-language";

/**
 * The owner's language, remembered.
 *
 * Everything the AI writes for the owner — the morning brief, the analysis, the
 * notes on a review — follows this one setting. It is read once on mount rather
 * than during render so the server and the first client paint agree.
 */
export function useOwnerLanguage(): [OwnerLanguage, (next: OwnerLanguage) => void] {
  const [language, setLanguage] = useState<OwnerLanguage>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "hi" || stored === "hinglish" || stored === "en") setLanguage(stored);
    } catch {
      // Private mode, blocked storage — English is a fine default.
    }
  }, []);

  const choose = useCallback((next: OwnerLanguage) => {
    setLanguage(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not worth surfacing; the choice still applies for this session.
    }
  }, []);

  return [language, choose];
}

/** The BCP-47 tag the browser's speech engines want. */
export function speechLocale(language: OwnerLanguage): string {
  return language === "en" ? "en-IN" : "hi-IN";
}

/**
 * Reading the answer out loud.
 *
 * The whole point of the owner mode is that the person running the spa should
 * not have to read a screen of English to know what to do. Every AI answer here
 * carries a `spoken` field written for exactly this — one short paragraph, no
 * lists, no symbols.
 */
export function useSpeech(language: OwnerLanguage) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Nothing to cancel.
      }
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!text || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLocale(language);
      utterance.rate = 0.95;

      // Hindi voices are not installed everywhere. Picking the closest match
      // explicitly beats letting the engine fall back to an American English
      // voice reading Devanagari, which is unintelligible.
      const voices = window.speechSynthesis.getVoices();
      const match =
        voices.find((v) => v.lang === utterance.lang) ??
        voices.find((v) => v.lang.startsWith(utterance.lang.split("-")[0]));
      if (match) utterance.voice = match;

      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  return { speak, stop, speaking, supported };
}

/**
 * Asking a question by talking instead of typing.
 *
 * Typing a business question in English is the exact barrier this mode exists
 * to remove. Chrome and Edge expose webkitSpeechRecognition; where it is
 * missing the caller hides the mic and the text field still works.
 */
export function useDictation(language: OwnerLanguage, onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const resultRef = useRef(onResult);
  resultRef.current = onResult;

  useEffect(() => {
    const Recognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    setSupported(Boolean(Recognition));
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Already stopped.
      }
    };
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped.
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Recognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = speechLocale(language);
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0].transcript;
      resultRef.current(text.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [language]);

  return { start, stop, listening, supported };
}
