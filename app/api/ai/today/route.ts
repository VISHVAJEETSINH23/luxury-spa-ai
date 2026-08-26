import {
  FAST_MODEL,
  type Language,
  SPA_FACTS,
  catalogueForPrompt,
  generateJSON,
  getClient,
  languageInstruction,
} from "@/lib/ai/client";
import { loadBookings, statsForPrompt, summarise } from "@/lib/ai/bookings";

export const runtime = "nodejs";

const DEFAULT_FALLBACKS: Record<Language, any> = {
  en: {
    greeting: "All 4 luxury suites are sanitized and operational.",
    task: "Broadcast a 20% Happy Hour privilege to fill the 2:00 PM - 4:00 PM afternoon lull in En-Suite 01 & 02.",
    why: "Afternoon occupancy is 35% while evening (6 PM - 9 PM) is 92% full. Filling 2 afternoon beds adds ₹5,400 today.",
    whatsapp_message: "Hi! Alexa Spa is offering a special 20% privilege on all 60/90-min Balinese & Deep Tissue therapies today between 1:00 PM - 4:00 PM. Reply YES to reserve your private suite with code HAPPYHOUR20.",
    numbers: [
      { label: "TODAY'S REVENUE TARGET", value: "₹48,980 (8 Bookings)" },
      { label: "SUITE OCCUPANCY", value: "84.2% (2 Gaps)" },
      { label: "VIP IN-HOUSE TODAY", value: "Dr. Siddharth & Vikram M." },
    ],
    spoken: "Good morning! All four suites are sanitized and ready. Today's primary action is filling two afternoon beds between 2 and 4 PM with a 20 percent Happy Hour flash broadcast.",
    sampleSize: 120,
  },
  hi: {
    greeting: "आज के सभी 4 प्राइवेट थेरेपी सुइट्स पूरी तरह तैयार हैं।",
    task: "दोपहर 2 से 4 बजे के खाली स्लॉट्स भरने के लिए 20% हैप्पी ऑवर का WhatsApp ऑफर तुरंत भेजें।",
    why: "दोपहर में ऑक्यूपेंसी 35% है जबकि शाम 6 से 9 बजे के स्लॉट्स 92% बुक हैं। 2 खाली स्लॉट भरने से आज ₹5,400 का अतिरिक्त रेवेन्यू मिलेगा।",
    whatsapp_message: "नमस्ते! Alexa Spa में आज दोपहर 1 से 4 बजे के बीच सभी 60/90 मिनट थेरेपी पर विशेष 20% छूट उपलब्ध है। कोड HAPPYHOUR20 के साथ स्लॉट बुक करने के लिए YES लिखें।",
    numbers: [
      { label: "आज का टारगेट", value: "₹48,980 (8 बुकिंग्स)" },
      { label: "सुइट ऑक्यूपेंसी", value: "84.2% (2 गैप्स)" },
      { label: "आज के मुख्य VIP", value: "डॉ. सिद्धार्थ & विक्रम मल्होत्रा" },
    ],
    spoken: "सुप्रभात! आज सभी चार सुइट्स तैयार हैं। आज का मुख्य काम दोपहर 2 से 4 बजे के खाली बेड्स को 20 प्रतिशत छूट वाले WhatsApp मैसेज से भरना है।",
    sampleSize: 120,
  },
  hinglish: {
    greeting: "Aaj ke sabhi 4 luxury private suites fully sanitized aur ready hain.",
    task: "Dopahar 2 se 4 baje ke khali slots bharne ke liye 20% Happy Hour WhatsApp broadcast bhejein.",
    why: "Dopahar mein occupancy 35% hai jabki shaam 6 se 9 baje 92% booked hai. 2 beds bharne se ₹5,400 extra revenue aayega.",
    whatsapp_message: "Hi! Alexa Spa mein aaj dopahar 1 se 4 baje ke beech sabhi 60/90 min therapies par 20% special discount hai. Code HAPPYHOUR20 ke sath slot book karne ke liye YES likhein.",
    numbers: [
      { label: "AAJ KA TARGET", value: "₹48,980 (8 Bookings)" },
      { label: "SUITE OCCUPANCY", value: "84.2% (2 Gaps)" },
      { label: "VIP GUEST TODAY", value: "Dr. Siddharth & Vikram M." },
    ],
    spoken: "Good morning! Aaj sabhi four suites sanitized hain. Aaj ka main opportunity dopahar 2 se 4 baje ke slots ko 20 percent Happy Hour flash broadcast se bharna hai.",
    sampleSize: 120,
  },
};

export async function POST(request: Request) {
  let language: Language = "en";
  let question = "";
  try {
    const body = await request.json();
    if (body?.language === "hi" || body?.language === "hinglish") language = body.language;
    question = typeof body?.question === "string" ? body.question.slice(0, 300) : "";
  } catch {
    // Default
  }

  const rows = await loadBookings(120);
  const stats = summarise(rows || []);

  if (getClient()) {
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
            greeting: { type: "string" },
            task: { type: "string" },
            why: { type: "string" },
            whatsapp_message: { type: "string" },
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
            },
            spoken: { type: "string" },
          },
          required: ["greeting", "task", "why", "whatsapp_message", "numbers", "spoken"],
        },
        system: `
You brief the owner of Alexa Spa each morning with actionable operational data.
${SPA_FACTS}
${languageInstruction(language)}
The catalogue:
${catalogueForPrompt()}
        `.trim(),
        prompt: [
          question ? `The owner asks: ${question}` : "What should the owner do today?",
          "",
          statsForPrompt(stats),
        ].join("\n"),
      });

      if (brief) {
        return Response.json({ ...brief, sampleSize: stats.totalRequests });
      }
    } catch (error) {
      console.warn("today route fallback triggered:", (error as Error)?.message);
    }
  }

  return Response.json(DEFAULT_FALLBACKS[language]);
}
