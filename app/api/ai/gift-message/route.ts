import {
  FAST_MODEL,
  SPA_FACTS,
  apiErrorResponse,
  generateJSON,
  getClient,
  missingKeyResponse,
} from "@/lib/ai/client";

export const runtime = "nodejs";

/**
 * Writes the note that goes on a gift voucher.
 *
 * The hardest part of buying a gift card is the two lines you have to write on
 * it; people abandon the form there. This gives them a draft to edit.
 */
export async function POST(request: Request) {
  if (!getClient()) return missingKeyResponse();

  let body: {
    occasion?: string;
    recipient?: string;
    sender?: string;
    amount?: number;
    tone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request body." }, { status: 400 });
  }

  const occasion = (body.occasion ?? "a treat").slice(0, 60);
  const recipient = (body.recipient ?? "").slice(0, 60).trim();
  const sender = (body.sender ?? "").slice(0, 60).trim();
  const tone = (body.tone ?? "warm").slice(0, 30);

  try {
    const parsed = await generateJSON<{ message: string }>({
      model: FAST_MODEL,
      maxOutputTokens: 300,
      temperature: 0.9,
      schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "The note itself. One or two sentences, at most 180 characters. No greeting line, no sign-off, no quotation marks, no emoji.",
          },
        },
        required: ["message"],
      },
      system: `
You write the short note printed on a spa gift voucher. You are writing as the
sender, to the recipient — never about them in the third person.

${SPA_FACTS}

Rules:
- One or two sentences. Never longer than 180 characters.
- Plain, affectionate, specific. No clichés about "pampering", no "indulge",
  no exclamation marks unless the occasion genuinely calls for one.
- Do not write a greeting ("Dear X") or a sign-off — the card prints those.
- Do not mention the amount, the spa's name, or any treatment by name.
      `.trim(),
      prompt: [
        `Occasion: ${occasion}`,
        recipient ? `Recipient's name: ${recipient}` : "Recipient's name: unknown",
        sender ? `From: ${sender}` : "From: unknown",
        `Tone: ${tone}`,
      ].join("\n"),
    });

    if (!parsed?.message) {
      return Response.json({ error: "Empty reply." }, { status: 502 });
    }

    return Response.json({ message: parsed.message.trim() });
  } catch (error) {
    console.error("gift-message:", error);
    return apiErrorResponse(error, "Couldn't write that just now.");
  }
}
