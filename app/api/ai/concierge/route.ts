import {
  FAST_MODEL,
  GROUNDING_RULES,
  SPA_FACTS,
  apiErrorResponse,
  catalogueForPrompt,
  generateJSON,
  getClient,
  missingKeyResponse,
} from "@/lib/ai/client";
import { COMPLETE_SPA_DATA } from "@/lib/treatments";

export const runtime = "nodejs";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface ConciergeReply {
  reply: string;
  therapy_id: string;
  promo_code: string;
  follow_up: string[];
}

/**
 * The wellness concierge.
 *
 * Answers in structured form rather than free text so the UI can act on the
 * recommendation — prefill the booking form with the right therapy and promo —
 * instead of parsing prose and hoping.
 *
 * Note the empty strings rather than nulls: Gemini's schema support is happier
 * with a fixed type per field, so "no recommendation yet" is "" and the route
 * treats it as absent.
 */
const REPLY_SCHEMA = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description:
        "What to say to the guest. Warm, concise, two to four sentences. No markdown, no bullet lists, no emoji.",
    },
    therapy_id: {
      type: "string",
      description:
        "Exact catalogue id of the treatment being recommended, or an empty string while you are still asking questions.",
    },
    promo_code: {
      type: "string",
      description: "AIWELLNESS20 once you make a firm recommendation, otherwise an empty string.",
    },
    follow_up: {
      type: "array",
      items: { type: "string" },
      description:
        "Up to three short replies the guest could tap next, written in their voice. Empty once a recommendation is made.",
    },
  },
  required: ["reply", "therapy_id", "promo_code", "follow_up"],
};

const SYSTEM = `
You are the wellness concierge for Alexa Spa. You talk to guests the way a good
front-of-house does: you listen, ask at most one question at a time, and get to
a recommendation quickly. You are never pushy and you never gush.

${SPA_FACTS}

${GROUNDING_RULES}

How to run the conversation:
- If the guest has already told you enough (where it hurts, or what they want),
  recommend one treatment straight away and set therapy_id.
- If not, ask ONE short question that would change your answer — usually where
  the discomfort is, or how much time they have.
- Once you recommend, set promo_code to AIWELLNESS20 and say the price plainly.
- Keep replies under 60 words. Write like a person, not a brochure.

The catalogue:
${catalogueForPrompt()}
`.trim();

export async function POST(request: Request) {
  if (!getClient()) return missingKeyResponse();

  let turns: Turn[] = [];
  try {
    const body = await request.json();
    turns = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: "Bad request body." }, { status: 400 });
  }

  if (turns.length === 0) {
    return Response.json({ error: "No message to answer." }, { status: 400 });
  }

  // A guest conversation that runs past this isn't a booking any more.
  const recent = turns.slice(-12);

  try {
    const parsed = await generateJSON<ConciergeReply>({
      model: FAST_MODEL,
      system: SYSTEM,
      schema: REPLY_SCHEMA,
      maxOutputTokens: 900,
      temperature: 0.6,
      prompt: recent.map((turn) => ({
        role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
        text: turn.content,
      })),
    });

    if (!parsed) {
      return Response.json({ error: "Empty reply." }, { status: 502 });
    }

    // Trust nothing: a hallucinated id would send the booking form to a
    // treatment that does not exist.
    const therapy = parsed.therapy_id
      ? COMPLETE_SPA_DATA.find((t) => t.id === parsed.therapy_id)
      : undefined;

    return Response.json({
      reply: parsed.reply,
      promoCode: therapy ? parsed.promo_code || "AIWELLNESS20" : null,
      followUp: (parsed.follow_up ?? []).slice(0, 3),
      therapy: therapy
        ? {
            id: therapy.id,
            title: therapy.title,
            price: therapy.price,
            duration: therapy.duration,
            image: therapy.image,
            pressure: therapy.pressure,
            oil: therapy.oil,
          }
        : null,
    });
  } catch (error) {
    console.error("concierge:", error);
    return apiErrorResponse(error, "The consultant is unavailable right now.");
  }
}
