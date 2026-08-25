import {
  FAST_MODEL,
  GROUNDING_RULES,
  SPA_FACTS,
  type Language,
  apiErrorResponse,
  catalogueForPrompt,
  generateJSON,
  getClient,
  languageInstruction,
  missingKeyResponse,
} from "@/lib/ai/client";

export const runtime = "nodejs";

/**
 * Writes a WhatsApp broadcast for the spa's customer list.
 *
 * Grounded in the real catalogue so an offer can never quote a treatment or a
 * price the spa does not have — a broadcast that goes out wrong is expensive to
 * take back.
 */
export async function POST(request: Request) {
  if (!getClient()) return missingKeyResponse();

  let body: {
    occasion?: string;
    goal?: string;
    audience?: string;
    discount?: string;
    language?: Language;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request body." }, { status: 400 });
  }

  const occasion = (body.occasion ?? "").trim().slice(0, 120);
  if (!occasion) {
    return Response.json({ error: "What is the campaign for?" }, { status: 400 });
  }

  const goal = (body.goal ?? "fill weekday afternoon slots").slice(0, 160);
  const audience = (body.audience ?? "past guests").slice(0, 120);
  const discount = (body.discount ?? "").slice(0, 60);
  const language: Language =
    body.language === "hi" || body.language === "hinglish" ? body.language : "en";

  try {
    const parsed = await generateJSON<{
      message: string;
      promo_code: string;
      hook: string;
      treatments: string[];
      best_time_to_send: string;
    }>({
      model: FAST_MODEL,
      maxOutputTokens: 1200,
      temperature: 0.8,
      schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "The WhatsApp broadcast, ready to send. WhatsApp formatting only (*bold*), line breaks allowed, at most 90 words.",
          },
          promo_code: {
            type: "string",
            description:
              "A short uppercase code for this campaign, or one of the existing codes if it fits.",
          },
          hook: {
            type: "string",
            description: "The first line on its own — what the guest sees in the preview.",
          },
          treatments: {
            type: "array",
            items: { type: "string" },
            description: "Catalogue ids of the treatments this campaign pushes.",
          },
          best_time_to_send: {
            type: "string",
            description: "A day and time, with one line of reasoning.",
          },
        },
        required: ["message", "promo_code", "hook", "treatments", "best_time_to_send"],
      },
      system: `
You write WhatsApp broadcasts for Alexa Spa's own customer list — people who
have already visited. You are not writing an advertisement; you are writing the
message a good spa owner would send.

${SPA_FACTS}

${GROUNDING_RULES}

How to write it:
- Under 90 words. Short lines. One offer, one action.
- Open with something true and specific, not "Dear valued customer".
- WhatsApp formatting only: *bold* for the offer and the code. No markdown
  headers, no bullet characters, at most one emoji and only if it earns its place.
- Always end with the WhatsApp number and what to send to book.
- Never promise a slot, a therapist, or a time you cannot guarantee.

${languageInstruction(language)}

The catalogue:
${catalogueForPrompt()}
      `.trim(),
      prompt: [
        `Occasion or reason: ${occasion}`,
        `Business goal: ${goal}`,
        `Audience: ${audience}`,
        discount ? `Discount to offer: ${discount}` : "Discount: your call, keep it sane",
      ].join("\n"),
    });

    if (!parsed?.message) {
      return Response.json({ error: "Empty reply." }, { status: 502 });
    }

    return Response.json({
      message: parsed.message.trim(),
      promoCode: parsed.promo_code,
      hook: parsed.hook,
      treatments: parsed.treatments ?? [],
      bestTimeToSend: parsed.best_time_to_send,
    });
  } catch (error) {
    console.error("campaign:", error);
    return apiErrorResponse(error, "Couldn't write that just now.");
  }
}
