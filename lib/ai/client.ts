import "server-only";
import { log } from "@/lib/server/log";

import { GoogleGenAI } from "@google/genai";
import { BRANCH_LIST, branchHours } from "@/lib/branches";
import { COMPLETE_SPA_DATA, formatRupees } from "@/lib/treatments";
import { stepsForPrompt } from "@/lib/therapyDetails";

/**
 * Server-side Gemini client.
 *
 * The key never reaches the browser: every AI feature goes through a route
 * handler in app/api/ai/*, and this module is marked server-only.
 */

export const FAST_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
export const THINKING_MODEL = process.env.GEMINI_THINKING_MODEL ?? "gemini-3.8-flash";

const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
];

/** One model gets this long before we move on; the whole chain gets DEADLINE_MS. */
const PER_MODEL_TIMEOUT_MS = 12_000;
const DEADLINE_MS = 25_000;

let cached: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!cached) cached = new GoogleGenAI({ apiKey });
  return cached;
}

export function missingKeyResponse() {
  return Response.json(
    {
      error:
        "AI is not configured yet — add GEMINI_API_KEY to .env.local and restart the dev server.",
    },
    { status: 503 }
  );
}

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
          "Gemini free-tier quota is busy. Switched to instant local operational engine.",
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
 * One structured-JSON call with automatic multi-model fallback chain.
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
    thinkingConfig: { thinkingBudget },
  };

  const modelsToTry = Array.from(new Set([model, ...FALLBACK_MODELS]));
  const deadline = Date.now() + DEADLINE_MS;

  for (const currentModel of modelsToTry) {
    const remaining = deadline - Date.now();
    if (remaining <= 1_000) {
      log.warn("gemini.deadline_reached", { model: currentModel });
      break;
    }
    try {
      // A model that hangs must not hold the guest (or the owner) hostage.
      const response = await client.models.generateContent({
        model: currentModel,
        contents,
        config: { ...config, abortSignal: AbortSignal.timeout(Math.min(PER_MODEL_TIMEOUT_MS, remaining)) },
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text) as T;
      }
    } catch (err) {
      log.warn("gemini.call_failed", { model: currentModel, message: (err as Error)?.message });
    }
  }

  return null;
}

export function catalogueForPrompt(): string {
  return COMPLETE_SPA_DATA.map((t) =>
    [
      `id: ${t.id}`,
      `name: ${t.title}`,
      `prices: ${t.options.map((o) => `${o.minutes} min ${formatRupees(o.price)}`).join(", ")}${t.forTwo ? " (price is for two guests)" : ""}`,
      `category: ${t.category}`,
      `pressure: ${t.pressure}`,
      `best for: ${t.bestFor}`,
      `about: ${t.description}`,
      `what happens in the session: ${stepsForPrompt(t.id)}`,
    ].join(" | ")
  ).join("\n");
}

export const GROUNDING_RULES = `
- Ground every recommendation in real catalogue IDs, actual prices in Indian Rupees (₹), and genuine facilities.
- Never invent therapies, amenities, or discounts that do not exist.
- Always be concise, polite, and professional.
`.trim();

// Only facts the spa has confirmed belong here — the concierge repeats them to
// guests word for word. Branch details come from lib/branches.ts.
export const SPA_FACTS = `
ALEXA SPA
- Treatments and prices are exactly the catalogue below; nothing else is offered.
- Couple prices are for two guests.
- For anything not listed here, ask the guest to message the spa on WhatsApp.
- Alexa Salon & Spa has two branches: Sangli and Karad. Same menu and prices at both.
${BRANCH_LIST.map(
  (b) =>
    `- ${b.city} branch: ${b.address ?? b.city}. Open 7 days, ${branchHours(b.id)}.` +
    (b.whatsapp ? ` WhatsApp / phone: +91 ${b.whatsapp}.` : "") +
    (b.mapsUrl ? ` Directions: ${b.mapsUrl}` : "")
).join("\n")}
- There are no discount or promo codes. Never offer one.
- Guests book on this website: pick a branch, therapy and time, then pay online or pay at the spa.
`.trim();

export type Language = "en" | "hi" | "hinglish";

export function languageInstruction(lang: Language): string {
  if (lang === "hi") {
    return `
Respond exclusively in clear, respectful Hindi written in the Devanagari script (e.g. "नमस्ते! Alexa Salon & Spa में आपका स्वागत है।").
Keep all prices formatted in Indian Rupees (₹).
`.trim();
  }
  if (lang === "hinglish") {
    return `
Respond exclusively in modern, conversational Hinglish (Hindi words written in the Latin/English alphabet, exactly how Indian professionals chat on WhatsApp, e.g. "Aapke liye humne Single En-Suite 01 mein 60m Deep Tissue slot lock kar diya hai.").
Keep all prices formatted in Indian Rupees (₹).
`.trim();
  }
  return `
Respond in refined, warm, professional English.
Keep all prices formatted in Indian Rupees (₹).
`.trim();
}
