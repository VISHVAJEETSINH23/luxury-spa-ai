import "server-only";

import { GoogleGenAI } from "@google/genai";
import { COMPLETE_SPA_DATA } from "@/lib/treatments";

/**
 * Server-side Gemini client.
 *
 * The key never reaches the browser: every AI feature goes through a route
 * handler in app/api/ai/*, and this module is marked server-only so an
 * accidental client import fails the build rather than shipping the key.
 */

/** Fast and free-tier friendly; the analysis route asks for a stronger one. */
export const FAST_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
export const THINKING_MODEL = process.env.GEMINI_THINKING_MODEL ?? "gemini-3.7-flash";

let cached: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!cached) cached = new GoogleGenAI({ apiKey });
  return cached;
}

/** Same shape for every route that has to answer "the key isn't set". */
export function missingKeyResponse() {
  return Response.json(
    {
      error:
        "AI is not configured yet — add GEMINI_API_KEY to .env.local (get one free at aistudio.google.com) and restart the dev server.",
    },
    { status: 503 }
  );
}

/**
 * Turns an SDK failure into something the person on screen can act on.
 *
 * Every failure used to surface as "unavailable right now", which hid the
 * causes that actually happen — a rejected key, an exhausted quota — behind a
 * message suggesting that waiting would fix them.
 */
export function apiErrorResponse(error: unknown, fallback: string) {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();

  if (message.includes("api key") || message.includes("permission") || message.includes("401")) {
    return Response.json(
      { error: "The Gemini API key was rejected — check GEMINI_API_KEY in .env.local." },
      { status: 503 }
    );
  }

  if (message.includes("quota") || message.includes("resource_exhausted") || message.includes("429")) {
    return Response.json(
      {
        error:
          "Gemini's free-tier quota is used up for now. It resets on its own — try again in a minute.",
      },
      { status: 429 }
    );
  }

  if (message.includes("safety") || message.includes("blocked")) {
    return Response.json(
      { error: "The model declined to answer that one. Try rephrasing it." },
      { status: 422 }
    );
  }

  return Response.json({ error: fallback }, { status: 502 });
}

/**
 * One structured-JSON call.
 *
 * Every feature on the site wants a typed object back, not prose — a
 * recommendation the booking form can act on, a reply the owner can paste, an
 * analysis the dashboard can lay out. Gemini's responseSchema gives us that
 * directly, so nothing downstream has to parse free text and hope.
 */
export async function generateJSON<T>({
  model,
  system,
  prompt,
  schema,
  maxOutputTokens = 2048,
  temperature = 0.7,
  thinkingBudget = 0,
}: {
  model: string;
  system: string;
  prompt: string | { role: "user" | "model"; text: string }[];
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
  /** 0 disables thinking, -1 lets the model decide. */
  thinkingBudget?: number;
}): Promise<T | null> {
  const client = getClient();
  if (!client) return null;

  const contents =
    typeof prompt === "string"
      ? prompt
      : prompt.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] }));

  const config = {
    systemInstruction: system,
    responseMimeType: "application/json",
    responseSchema: schema,
    maxOutputTokens,
    temperature,
    // Thinking tokens are drawn from the same budget as the answer. A short
    // request with a small ceiling would spend the entire allowance thinking
    // and return an empty string — which is exactly what happened before this
    // was set. Off for the quick routes; the analysis route opts back in.
    thinkingConfig: { thinkingBudget },
  };

  let response;
  try {
    response = await client.models.generateContent({ model, contents, config });
  } catch (error) {
    // Free-tier capacity for the newest model comes and goes. Rather than fail
    // the feature, drop to the model that is always up.
    const status = (error as { status?: number })?.status;
    const overloaded = status === 503 || String((error as Error)?.message).includes("UNAVAILABLE");
    if (!overloaded || model === FAST_MODEL) throw error;

    response = await client.models.generateContent({
      model: FAST_MODEL,
      contents,
      config,
    });
  }

  const text = response.text;
  if (!text) return null;

  return JSON.parse(text) as T;
}

/**
 * The menu, rendered for a prompt. Generated rather than written by hand so a
 * price change in lib/treatments.ts can never leave the AI quoting an old one —
 * the single most damaging thing a spa concierge could get wrong.
 */
export function catalogueForPrompt(): string {
  return COMPLETE_SPA_DATA.map((t) =>
    [
      `id: ${t.id}`,
      `name: ${t.title}`,
      `price: ${t.price} (was ${t.originalPrice})`,
      `duration: ${t.duration}`,
      `category: ${t.category}`,
      `pressure: ${t.pressure}`,
      `oil: ${t.oil}`,
      `good for: ${t.subtitle}`,
      `detail: ${t.description}`,
    ].join(" | ")
  ).join("\n");
}

export const SPA_FACTS = `
Alexa Spa & Wellness Center, 2nd floor, Grand Commercial Plaza, Main Boulevard, Mumbai.
Open seven days, 10:00–22:00, last slot 21:15. Happy hours Mon–Thu 11:00–16:00.
Phone and WhatsApp: +91 98200 12345.
Every treatment includes a private en-suite room with its own hot shower, a
sterilised single-use kit (linen, innerwear, slippers) and herbal tea afterwards.
Therapists are certified in anatomy and pressure calibration. Basalt stones and
towels are autoclaved at 120°C after every session. No advance payment is taken —
guests pay at the spa. Bookings are confirmed on WhatsApp within minutes.
Promo codes: FIRST20 (20% first visit), HAPPYHOUR (25%, Mon–Thu 11:00–16:00),
VIP30 (30%, members), AIWELLNESS20 (20%, given by the AI consultant).
`.trim();

export type Language = "en" | "hi" | "hinglish";

/**
 * How to talk to the owner.
 *
 * The analysis was written in English business prose, which is useless to an
 * owner who does not read English comfortably — the most likely person to be
 * running the spa day to day. Hinglish in Latin script is the default a lot of
 * Indian owners actually read fastest, so it gets its own mode rather than
 * being approximated by "simple English".
 */
export function languageInstruction(language: Language | undefined): string {
  if (language === "hi") {
    return `
Write everything in Hindi, in Devanagari script. Use the plain spoken Hindi a
shop owner uses, not formal or Sanskritised Hindi. Keep English words that
people actually say in Hindi — booking, slot, offer, discount, WhatsApp,
massage, couple suite — do not translate those. Numbers and prices in digits.
No business jargon.
    `.trim();
  }

  if (language === "hinglish") {
    return `
Write everything in Hinglish — Hindi sentences in Latin script, the way people
type on WhatsApp. Example: "Weekday dopahar ke slots khaali ja rahe hain, unpe
25% ka offer chala do." Keep English words that people actually use — booking,
slot, offer, discount, massage, couple suite. Numbers and prices in digits. No
business jargon, no formal English.
    `.trim();
  }

  return "Write in plain English. Short sentences, no business jargon.";
}

/** Never let a model invent a treatment or a price. */
export const GROUNDING_RULES = `
Rules you must follow:
- Only ever recommend treatments from the catalogue below, by their exact id.
- Never invent a treatment, a price, a duration or an offer that is not listed.
- If someone asks for something the spa does not do (physiotherapy, medical
  treatment, waxing, hair), say so plainly and suggest the closest thing it does.
- Never give medical advice or diagnose anything. For pain that sounds like an
  injury, recommend they see a doctor first and offer a gentle treatment.
- Prices are in Indian rupees and are already final; nothing is added at the desk.
`.trim();
