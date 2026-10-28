/**
 * "Where does it hurt?" → which therapy, at which length.
 *
 * One table for the whole site: the body mapper shows it, the AI concierge is
 * told it in its prompt, and the concierge's offline fallback matches against
 * the same keywords. Change a mapping here and all three move together.
 *
 * therapyId must exist in lib/treatments.ts and minutes must be one of that
 * therapy's menu lengths — the price shown is read from the menu.
 */
import type { GuestLanguage } from "@/lib/guestLanguage";

export interface BodyZoneText {
  name: string;
  symptom: string;
  description: string;
}

export interface BodyZone {
  id: string;
  therapyId: string;
  minutes: number;
  /** Lower-case words a guest might type about this area, in all three languages. */
  keywords: RegExp;
  text: Record<GuestLanguage, BodyZoneText>;
}

export const BODY_ZONES: BodyZone[] = [
  {
    id: "neck-shoulders",
    therapyId: "deep-tissue",
    minutes: 60,
    keywords: /neck|shoulder|trap|upper back|desk|laptop|गर्दन|कंधे|कंधा|मानदुखी|मान दुख|मान आखड|खांद/,
    text: {
      en: {
        name: "Neck & Shoulders",
        symptom: "Desk stiffness, computer neck, tight shoulders",
        description:
          "Slow, firm pressure worked into the neck, upper back and shoulders to release the knots that long hours at a desk leave behind.",
      },
      hi: {
        name: "गर्दन और कंधे",
        symptom: "डेस्क जॉब की अकड़न, कंप्यूटर से गर्दन दर्द, कंधों में जकड़न",
        description:
          "गर्दन, ऊपरी पीठ और कंधों पर धीमा, गहरा दबाव — ताकि घंटों डेस्क पर बैठने से बनी गांठें खुल जाएँ।",
      },
      mr: {
        name: "मान आणि खांदे",
        symptom: "डेस्क जॉबमुळे आखडलेपणा, कॉम्प्युटरमुळे मानदुखी, खांद्यांमध्ये ताण",
        description:
          "मान, वरची पाठ आणि खांद्यांवर संथ, खोल दाब — तासन्तास डेस्कवर बसल्यामुळे झालेल्या गाठी मोकळ्या करण्यासाठी.",
      },
    },
  },
  {
    id: "lower-back",
    therapyId: "deep-tissue",
    minutes: 90,
    keywords: /lower back|back pain|backache|spine|lumbar|kamar|पीठ|कमर|पाठ|कंबर/,
    text: {
      en: {
        name: "Lower Back",
        symptom: "Sitting fatigue, lower back tightness, back soreness",
        description:
          "Deep, steady pressure along the lower back and hips. The 90-minute session leaves time to work the whole back, not just the sore spot.",
      },
      hi: {
        name: "कमर और निचली पीठ",
        symptom: "लंबे समय बैठने की थकान, कमर में जकड़न, पीठ दर्द",
        description:
          "कमर और कूल्हों पर गहरा, स्थिर दबाव। 90 मिनट के सेशन में सिर्फ दर्द वाली जगह नहीं, पूरी पीठ पर काम होता है।",
      },
      mr: {
        name: "कंबर आणि खालची पाठ",
        symptom: "जास्त वेळ बसल्याचा थकवा, कंबरेत ताण, पाठदुखी",
        description:
          "कंबर आणि नितंबांवर खोल, स्थिर दाब. 90 मिनिटांच्या सेशनमध्ये फक्त दुखणाऱ्या जागेवर नाही, संपूर्ण पाठीवर काम होते.",
      },
    },
  },
  {
    id: "stress-sleep",
    therapyId: "aroma-massage",
    minutes: 60,
    keywords: /stress|anxi|headache|sleep|insomnia|tension|mind|तनाव|टेंशन|सिरदर्द|सिर दर्द|नींद|ताण|डोकेदुखी|झोप/,
    text: {
      en: {
        name: "Stress & Sleep",
        symptom: "Mental fatigue, tension headaches, poor sleep",
        description:
          "A full-body massage with slow, soothing strokes and aromatic oils to quiet a busy mind — the gentlest choice when stress is what you're carrying.",
      },
      hi: {
        name: "तनाव और नींद",
        symptom: "मानसिक थकान, तनाव से सिरदर्द, नींद न आना",
        description:
          "खुशबूदार तेलों के साथ धीमे, सुकून भरे स्ट्रोक वाली फुल-बॉडी मसाज, जो बेचैन मन को शांत करती है — जब परेशानी तनाव की हो, तो सबसे कोमल विकल्प।",
      },
      mr: {
        name: "ताण आणि झोप",
        symptom: "मानसिक थकवा, ताणामुळे डोकेदुखी, झोप न लागणे",
        description:
          "सुगंधी तेलांसह संथ, सुखद स्ट्रोकचा फुल-बॉडी मसाज, जो अस्वस्थ मनाला शांत करतो — त्रास ताणाचा असेल तर सर्वात सौम्य पर्याय.",
      },
    },
  },
  {
    id: "legs-feet",
    therapyId: "dry-massage",
    minutes: 60,
    keywords: /leg|calf|calves|feet|foot|standing|knee|thigh|पैर|पिंडली|तलव|घुटन|पाय|पोटरी|गुडघ/,
    text: {
      en: {
        name: "Legs & Feet",
        symptom: "Tired from standing, tight calves, heavy legs",
        description:
          "Firm palm pressure and assisted stretches through the legs and hips to loosen tight calves and hamstrings — no oil needed.",
      },
      hi: {
        name: "पैर और तलवे",
        symptom: "खड़े रहने की थकान, पिंडलियों में जकड़न, भारी पैर",
        description:
          "पैरों और कूल्हों पर हथेली का तेज़ दबाव और स्ट्रेचिंग, जिससे जकड़ी पिंडलियाँ और जांघें ढीली होती हैं — तेल की ज़रूरत नहीं।",
      },
      mr: {
        name: "पाय आणि तळपाय",
        symptom: "उभं राहून थकवा, पोटऱ्यांमध्ये ताण, जड पाय",
        description:
          "पाय आणि नितंबांवर तळहाताचा जोरदार दाब आणि स्ट्रेचिंग, ज्यामुळे आखडलेल्या पोटऱ्या आणि मांड्या मोकळ्या होतात — तेलाची गरज नाही.",
      },
    },
  },
  {
    id: "full-body",
    therapyId: "four-hand",
    minutes: 60,
    keywords: /full body|whole body|burn ?out|exhaust|everything|पूरा शरीर|पूरे शरीर|थकान|संपूर्ण शरीर|थकवा/,
    text: {
      en: {
        name: "Full Body Exhaustion",
        symptom: "Total burnout, everything aches",
        description:
          "Two therapists working in sync from head to toe. When everything aches, four hands cover the whole body in one deeply relaxing session.",
      },
      hi: {
        name: "पूरे शरीर की थकान",
        symptom: "पूरी तरह थक जाना, पूरा शरीर दुखना",
        description:
          "दो थेरेपिस्ट एक साथ सिर से पैर तक। जब पूरा शरीर दुखे, तो चार हाथ एक ही गहरे आरामदायक सेशन में पूरे शरीर को कवर करते हैं।",
      },
      mr: {
        name: "संपूर्ण शरीराचा थकवा",
        symptom: "पूर्ण थकून जाणे, संपूर्ण शरीर दुखणे",
        description:
          "दोन थेरपिस्ट एकत्र डोक्यापासून पायापर्यंत. संपूर्ण शरीर दुखत असेल तर चार हात एकाच खोल आरामदायक सेशनमध्ये संपूर्ण शरीर कव्हर करतात.",
      },
    },
  },
];

export function findBodyZone(text: string): BodyZone | undefined {
  const lower = text.toLowerCase();
  return BODY_ZONES.find((zone) => zone.keywords.test(lower));
}

/** For the AI prompt, so the concierge recommends what the body mapper shows. */
export function bodyZonesForPrompt(): string {
  return BODY_ZONES.map(
    (zone) => `- ${zone.text.en.name} (${zone.text.en.symptom}) → ${zone.therapyId}, ${zone.minutes} min`
  ).join("\n");
}
