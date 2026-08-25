import {
  FAST_MODEL,
  SPA_FACTS,
  type Language,
  apiErrorResponse,
  generateJSON,
  getClient,
  languageInstruction,
  missingKeyResponse,
} from "@/lib/ai/client";

export const runtime = "nodejs";

/**
 * Drafts the owner's public reply to a Google review.
 *
 * Replying to reviews is the single highest-leverage half hour a spa owner
 * spends online, and it is the one that always slips. This writes the draft;
 * the owner edits and posts it.
 */
export async function POST(request: Request) {
  if (!getClient()) return missingKeyResponse();

  let body: { review?: string; rating?: number; guestName?: string; language?: Language };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request body." }, { status: 400 });
  }

  const review = (body.review ?? "").trim().slice(0, 4000);
  if (!review) {
    return Response.json({ error: "Paste the review first." }, { status: 400 });
  }

  const rating = Number.isFinite(body.rating) ? Number(body.rating) : null;
  const guestName = (body.guestName ?? "").trim().slice(0, 60);

  try {
    const parsed = await generateJSON<{
      reply: string;
      sentiment: string;
      issues: string[];
    }>({
      model: FAST_MODEL,
      maxOutputTokens: 900,
      temperature: 0.6,
      schema: {
        type: "object",
        properties: {
          reply: {
            type: "string",
            description: "The public reply, ready to paste. Plain text, no markdown, no emoji.",
          },
          sentiment: {
            type: "string",
            enum: ["positive", "mixed", "negative"],
          },
          issues: {
            type: "array",
            items: { type: "string" },
            description:
              "Specific complaints worth acting on internally. Empty when there are none.",
          },
        },
        required: ["reply", "sentiment", "issues"],
      },
      system: `
You draft public replies to Google reviews on behalf of the owner of Alexa Spa.

${SPA_FACTS}

How to reply:
- Under 70 words. Warm, specific, and human — a person replying, not a brand.
- Name the thing they actually mentioned. Never reply generically.
- Thank them once, at most. Never grovel, never use "we sincerely apologise for
  any inconvenience caused" or similar corporate filler.
- For a complaint: acknowledge it plainly, say what will change or be checked,
  and invite them to contact the spa directly on +91 98200 12345. Do not argue,
  do not blame the guest, do not offer refunds or free treatments — that is the
  owner's decision, not yours.
- Never invent facts about what happened during their visit.
- Do not sign off with a name; the owner adds that.
- Reply in the same language the review is written in, whatever the owner's own
  language setting is — the reply is public and the guest has to read it.

The notes for the owner (the "issues" field) follow the owner's language:
${languageInstruction(body.language)}
      `.trim(),
      prompt: [
        rating !== null ? `Rating: ${rating} of 5` : "Rating: not given",
        guestName ? `Guest name: ${guestName}` : "Guest name: unknown",
        "Review:",
        review,
      ].join("\n"),
    });

    if (!parsed?.reply) {
      return Response.json({ error: "Empty reply." }, { status: 502 });
    }

    return Response.json({
      reply: parsed.reply.trim(),
      sentiment: parsed.sentiment,
      issues: parsed.issues ?? [],
    });
  } catch (error) {
    console.error("review-reply:", error);
    return apiErrorResponse(error, "Couldn't draft that just now.");
  }
}
