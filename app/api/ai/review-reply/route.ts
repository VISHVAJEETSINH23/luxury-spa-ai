import {
  FAST_MODEL,
  SPA_FACTS,
  type Language,
  generateJSON,
  getClient,
  languageInstruction,
} from "@/lib/ai/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { review?: string; rating?: number; guestName?: string; language?: Language } = {};
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
  const lang: Language = body.language === "hi" || body.language === "hinglish" ? body.language : "en";

  if (getClient()) {
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
            reply: { type: "string" },
            sentiment: { type: "string", enum: ["positive", "mixed", "negative"] },
            issues: { type: "array", items: { type: "string" } },
          },
          required: ["reply", "sentiment", "issues"],
        },
        system: `
You draft public replies to Google reviews on behalf of the owner of Alexa Spa.
${SPA_FACTS}
The notes for the owner follow the owner's language:
${languageInstruction(lang)}
        `.trim(),
        prompt: [
          rating !== null ? `Rating: ${rating} of 5` : "Rating: not given",
          guestName ? `Guest name: ${guestName}` : "Guest name: unknown",
          "Review:",
          review,
        ].join("\n"),
      });

      if (parsed) {
        return Response.json(parsed);
      }
    } catch (error) {
      console.warn("review-reply fallback:", (error as Error)?.message);
    }
  }

  // Graceful fallback
  const isGood = rating === null || rating >= 4;
  return Response.json({
    reply: isGood
      ? `Thank you so much${guestName ? ` ${guestName}` : ""} for visiting Alexa Spa! We are delighted you enjoyed our private suite experience and look forward to welcoming you back.`
      : `Thank you for sharing your feedback${guestName ? ` ${guestName}` : ""}. We take our 5-star service standards very seriously and would love to speak with you directly on +91 98200 12345 to make things right.`,
    sentiment: isGood ? "positive" : "mixed",
    issues: isGood ? [] : ["Guest mentioned service feedback to review."],
  });
}
