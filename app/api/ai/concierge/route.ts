import {
  FAST_MODEL,
  SPA_FACTS,
  catalogueForPrompt,
  generateJSON,
  getClient,
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

const REPLY_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    therapy_id: { type: "string" },
    promo_code: { type: "string" },
    follow_up: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["reply", "therapy_id", "promo_code", "follow_up"],
};

const SYSTEM = `
You are the wellness concierge for Alexa Spa. You talk to guests the way a good
front-of-house does: listen, ask at most one question, and get to a recommendation quickly.

${SPA_FACTS}

The catalogue:
${catalogueForPrompt()}
`.trim();

function getLocalConciergeFallback(userMsg: string): ConciergeReply {
  const lower = userMsg.toLowerCase();

  if (lower.includes("couple") || lower.includes("anniversary") || lower.includes("partner") || lower.includes("two")) {
    return {
      reply: "For a memorable shared experience, I recommend our Royal Couple Sanctuary Suite. It features private rose petal mineral baths, custom aromatherapy, and synchronized full-body massage.",
      therapy_id: "royal-couple-suite",
      promo_code: "AIWELLNESS20",
      follow_up: ["What amenities are included?", "Can we choose the essential oil?", "Book now"],
    };
  }

  if (lower.includes("neck") || lower.includes("back") || lower.includes("pain") || lower.includes("knot") || lower.includes("deep") || lower.includes("gym")) {
    return {
      reply: "For stubborn tension and muscle knots, our 60-min Deep Tissue & Heated Volcanic Knot Release is ideal. It targets deep fascia with warm organic Alpine Eucalyptus oil.",
      therapy_id: "deep-tissue",
      promo_code: "AIWELLNESS20",
      follow_up: ["Does it include private shower?", "Can I customize the pressure?", "Book slot"],
    };
  }

  if (lower.includes("facial") || lower.includes("glow") || lower.includes("skin") || lower.includes("gold")) {
    return {
      reply: "For luminous skin renewal, our 24K Gold Cellular Renewal Facial utilizes pure gold leaf and botanical antioxidants in our private Facial Suite 03.",
      therapy_id: "facial-gold",
      promo_code: "AIWELLNESS20",
      follow_up: ["How long does it take?", "Is it good for sensitive skin?", "Book this facial"],
    };
  }

  return {
    reply: "Welcome to Alexa Spa. Our signature Balinese Aromatherapy massage is the ultimate full-body relaxation therapy, blending gentle stretching with warm organic Kashmir Lavender oil.",
    therapy_id: "balinese-aromatherapy",
    promo_code: "AIWELLNESS20",
    follow_up: ["Tell me about the suites", "What is the price?", "Reserve appointment"],
  };
}

export async function POST(request: Request) {
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

  const recent = turns.slice(-12);
  const lastUserText = recent.filter((t) => t.role === "user").pop()?.content || "";

  if (getClient()) {
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

      if (parsed) {
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
      }
    } catch (error) {
      console.warn("concierge fallback triggered:", (error as Error)?.message);
    }
  }

  // Seamless zero-failure fallback
  const fallback = getLocalConciergeFallback(lastUserText);
  const therapy = COMPLETE_SPA_DATA.find((t) => t.id === fallback.therapy_id);

  return Response.json({
    reply: fallback.reply,
    promoCode: fallback.promo_code,
    followUp: fallback.follow_up,
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
}
