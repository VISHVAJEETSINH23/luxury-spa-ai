import {
  FAST_MODEL,
  GROUNDING_RULES,
  type Language,
  SPA_FACTS,
  apiErrorResponse,
  catalogueForPrompt,
  generateJSON,
  getClient,
  languageInstruction,
  missingKeyResponse,
} from "@/lib/ai/client";
import { loadBookings, statsForPrompt, summarise } from "@/lib/ai/bookings";

export const runtime = "nodejs";

/**
 * One thing to do today, and the WhatsApp message that does it.
 *
 * The full analysis is a report, and a report is something an owner reads on a
 * quiet afternoon that never comes. This is the same data reduced to a single
 * next step, in the owner's own language, with the message already written so
 * that acting on it costs one tap rather than an evening.
 */
export async function POST(request: Request) {
  if (!getClient()) return missingKeyResponse();

  let language: Language = "en";
  let question = "";
  try {
    const body = await request.json();
    if (body?.language === "hi" || body?.language === "hinglish") language = body.language;
    question = typeof body?.question === "string" ? body.question.slice(0, 300) : "";
  } catch {
    // A plain "what should I do today" is the default.
  }

  const rows = await loadBookings(120);
  if (rows === null) {
    return Response.json(
      { error: "Booking data isn't readable — check ADMIN_INSIGHTS_SECRET in .env.local." },
      { status: 503 }
    );
  }

  const stats = summarise(rows);

  try {
    const brief = await generateJSON<{
      greeting: string;
      task: string;
      why: string;
      whatsapp_message: string;
      numbers: { label: string; value: string }[];
      spoken: string;
    }>({
      model: FAST_MODEL,
      maxOutputTokens: 1600,
      temperature: 0.6,
      schema: {
        type: "object",
        properties: {
          greeting: {
            type: "string",
            description: "One short line about how the spa is doing right now. Max 12 words.",
          },
          task: {
            type: "string",
            description:
              "The single most useful thing the owner should do today. One sentence, an instruction, max 20 words.",
          },
          why: {
            type: "string",
            description: "Why this one, in one sentence with the number that justifies it.",
          },
          whatsapp_message: {
            type: "string",
            description:
              "A ready-to-send WhatsApp message that carries out the task — an offer, a reminder, a nudge to past guests. If the task is not a message, write a short note the owner can send to their staff group instead.",
          },
          numbers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "string" },
              },
              required: ["label", "value"],
            },
            description: "Three numbers worth knowing today. Labels of two or three words.",
          },
          spoken: {
            type: "string",
            description:
              "The whole briefing as one short spoken paragraph, for reading aloud. Max 60 words, no lists, no symbols, no markdown.",
          },
        },
        required: ["greeting", "task", "why", "whatsapp_message", "numbers", "spoken"],
      },
      system: `
You brief the owner of Alexa Spa each morning. The owner runs the spa, does not
read business English, and has about thirty seconds. Give them one thing to do.

${SPA_FACTS}

${GROUNDING_RULES}

${languageInstruction(language)}

How to choose the task:
- Prefer something that can be done today with a phone: send an offer, call back
  a guest, open a slot, fix a listing.
- If bookings are very few, say so honestly and make the task about finding out
  why — not about a discount.
- If a slot or a day is empty, that is usually the best task.
- Never suggest discounting a treatment that is already selling well.
- The WhatsApp message must be sendable as written, with the price and code in it.

The catalogue:
${catalogueForPrompt()}
      `.trim(),
      prompt: [
        question ? `The owner asks: ${question}` : "What should the owner do today?",
        "",
        statsForPrompt(stats),
      ].join("\n"),
    });

    if (!brief) {
      return Response.json({ error: "Empty reply." }, { status: 502 });
    }

    return Response.json({ ...brief, sampleSize: stats.totalRequests });
  } catch (error) {
    console.error("today:", error);
    return apiErrorResponse(error, "Couldn't put today's briefing together.");
  }
}
