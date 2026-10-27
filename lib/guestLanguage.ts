"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The language a guest reads the site in. One choice, shared by the booking
 * chatbot, the AI consultant and the therapy detail sheet — pick Marathi in
 * one place and every guest-facing panel follows.
 */
export type GuestLanguage = "en" | "hi" | "mr";

export const GUEST_LANGUAGES: { id: GuestLanguage; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "hi", label: "हिंदी" },
  { id: "mr", label: "मराठी" },
];

const STORAGE_KEY = "alexa-chat-language";
const CHANGE_EVENT = "alexa:language-change";

function isGuestLanguage(value: unknown): value is GuestLanguage {
  return value === "en" || value === "hi" || value === "mr";
}

export function useGuestLanguage(): [GuestLanguage, (next: GuestLanguage) => void] {
  const [language, setLanguageState] = useState<GuestLanguage>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isGuestLanguage(stored)) setLanguageState(stored);
    } catch {
      // storage unavailable — stay on English
    }

    const onChange = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (isGuestLanguage(next)) setLanguageState(next);
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const setLanguage = useCallback((next: GuestLanguage) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, []);

  return [language, setLanguage];
}
