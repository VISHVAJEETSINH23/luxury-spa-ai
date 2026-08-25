import {
  SPA_FACTS,
  THINKING_MODEL,
  type Language,
  apiErrorResponse,
  generateJSON,
  getClient,
  languageInstruction,
  missingKeyResponse,
} from "@/lib/ai/client";
import { loadBookings, statsForPrompt, summarise } from "@/lib/ai/bookings";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!getClient()) return missingKeyResponse();

  let question = "";
  let language: Language = "en";
  try {
    const body = await request.json();
    question = typeof body?.question === "string" ? body.question.slice(0, 500) : "";
    if (body?.language === "hi" || body?.language === "hinglish") language = body.language;
  } catch {
    // A plain "analyse everything" request is fine.
  }

  const rows = await loadBookings(120);

  if (rows === null) {
    return Response.json(
      {
        error:
          "Booking data isn't readable — check ADMIN_INSIGHTS_SECRET in .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  if (rows.length === 0) {
    return Response.json(
      {
        error:
          "No booking requests yet. Once guests start booking, this will analyse the pattern.",
      },
      { status: 200 }
    );
  }

  const stats = summarise(rows);

  try {
    const analysis = await generateJSON<{
      headline: string;
      metrics: { label: string; value: string; note: string }[];
      findings: string[];
      actions: { action: string; why: string; effort: string; impact: string }[];
      risks: string[];
      spoken: string;
    }>({
      // The one route worth the slower model: this is the output that changes
      // what the owner does with their week.
      model: THINKING_MODEL,
      maxOutputTokens: 6000,
      temperature: 0.4,
      // The only route where thinking earns its tokens.
      thinkingBudget: -1,
      schema: {
        type: "object",
        properties: {
          headline: {
            type: "string",
            description: "One sentence: the single most important thing in this data.",
          },
          metrics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "string" },
                note: { type: "string" },
              },
              required: ["label", "value", "note"],
            },
            description: "Four to six numbers worth watching, with what each one means.",
          },
          findings: {
            type: "array",
            items: { type: "string" },
            description: "What the data actually shows. Specific, with numbers.",
          },
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                why: { type: "string" },
                effort: { type: "string", enum: ["quick", "medium", "big"] },
                impact: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["action", "why", "effort", "impact"],
            },
            description: "Three to six things to do next, most valuable first.",
          },
          spoken: {
            type: "string",
            description:
              "The whole analysis as one spoken paragraph, for reading aloud to an owner who does not read. Max 90 words, no lists, no symbols, no markdown.",
          },
          risks: {
            type: "array",
            items: { type: "string" },
            description: "What could be going wrong, including what the data cannot tell you.",
          },
        },
        required: ["headline", "metrics", "findings", "actions", "risks", "spoken"],
      },
      system: `
You are an operator who has run day spas for twenty years, reading the booking
data of one spa and telling its owner what to do about it.

${SPA_FACTS}

How to think:
- Work only from the numbers given. Say plainly when the sample is too small to
  conclude anything — a handful of requests is not a trend.
- Prefer findings the owner can act on this week over general observations.
- Watch for: treatments nobody books, slots that never fill, discount codes
  eating margin, weekday troughs, couple-suite demand, and lead time (how far
  ahead people book) as a signal for how much stock to hold back.
- Rupees, not dollars. Indian market, Mumbai.
- Never invent a number that is not in the data.

${languageInstruction(language)}
      `.trim(),
      prompt: [
        question ? `The owner asks: ${question}` : "Give the owner a full read of this data.",
        "",
        statsForPrompt(stats),
      ].join("\n"),
    });

    if (!analysis) {
      return Response.json({ error: "Empty reply." }, { status: 502 });
    }

    return Response.json({ ...analysis, sampleSize: stats.totalRequests });  } catch (error) {
    console.error("insights:", error);
    return apiErrorResponse(error, "Couldn't analyse that just now.");
  }
}
