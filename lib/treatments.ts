/**
 * The treatment catalogue — the single source of truth for the whole site.
 *
 * It used to live inside ServicesMenu.tsx, which meant server code (the AI
 * routes) could not read it without pulling in a client component. Menu,
 * booking form, body mapper and the AI concierge all import it from here.
 *
 * Prices and durations are copied from the spa's printed menu card
 * ("ALEXA MENU CARD.pdf", checked 27 Oct 2026). Change them there first, then here.
 */

/** One bookable length of a treatment, at the menu price for that length. */
export interface TreatmentOption {
  minutes: number;
  price: number;
}

export interface SpaTreatmentData {
  id: string;
  category: "all" | "massages" | "couple" | "specials";
  tag: string;
  title: string;
  subtitle: string;
  /** Every length on the menu, shortest first. */
  options: TreatmentOption[];
  /** Derived: "45 / 60 Min". */
  duration: string;
  /** Derived: "From ₹2,000", or "₹2,000" when there is only one length. */
  price: string;
  image: string;
  pressure: string;
  bestFor: string;
  /** Priced for two guests rather than one. */
  forTwo?: boolean;
  description: string;
}

export function formatRupees(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

type MenuEntry = Omit<SpaTreatmentData, "duration" | "price">;

const MENU: MenuEntry[] = [
  {
    id: "dry-massage",
    category: "massages",
    tag: "NO OIL",
    title: "Dry Massage",
    subtitle: "Firm palm pressure and assisted stretches, done without oil.",
    options: [
      { minutes: 45, price: 2000 },
      { minutes: 60, price: 2600 },
    ],
    image: "/images/menu-dry-massage.jpg",
    pressure: "Firm",
    bestFor: "Stiffness, flexibility",
    description:
      "A full-body massage without oil, using rhythmic palm and thumb pressure with gentle assisted stretching to loosen stiff joints and tight muscles.",
  },
  {
    id: "aroma-massage",
    category: "massages",
    tag: "AROMA OILS",
    title: "Aroma Massage",
    subtitle: "Slow, soothing strokes with fragrant aromatic oils.",
    options: [
      { minutes: 45, price: 2400 },
      { minutes: 60, price: 3000 },
    ],
    image: "/images/menu-aroma-massage.jpg",
    pressure: "Light to medium",
    bestFor: "Stress, mental fatigue",
    description:
      "A calming full-body massage with aromatic oils and slow, flowing strokes — for when the mind needs the rest as much as the body.",
  },
  {
    id: "swedish-massage",
    category: "massages",
    tag: "RELAXING",
    title: "Swedish Massage",
    subtitle: "Long, flowing strokes to relax the whole body.",
    options: [
      { minutes: 45, price: 2600 },
      { minutes: 60, price: 3600 },
    ],
    image: "/images/service-head-to-toe.jpg",
    pressure: "Light to medium",
    bestFor: "Relaxation, better sleep",
    description:
      "The classic relaxation massage: long gliding strokes and gentle kneading across the whole body to ease tension and improve circulation.",
  },
  {
    id: "deep-tissue",
    category: "massages",
    tag: "FOR MUSCLE PAIN",
    title: "Deep Tissue Massage",
    subtitle: "Firm, slow pressure on the deeper muscle layers and knots.",
    options: [
      { minutes: 45, price: 2600 },
      { minutes: 60, price: 3600 },
      { minutes: 90, price: 4500 },
    ],
    image: "/images/menu-deep-tissue.jpg",
    pressure: "Firm to deep",
    bestFor: "Neck, back & shoulder pain",
    description:
      "Slow, firm pressure worked into the deeper layers of muscle to release knots and chronic tightness — the one to choose for desk stiffness and back pain.",
  },
  {
    id: "signature-massage",
    category: "massages",
    tag: "HOUSE SIGNATURE",
    title: "Signature Massage",
    subtitle: "The spa's own signature full-body massage.",
    options: [
      { minutes: 45, price: 2600 },
      { minutes: 60, price: 3600 },
      { minutes: 90, price: 5500 },
    ],
    image: "/images/menu-signature-massage.jpg",
    pressure: "Tailored to you",
    bestFor: "A complete full-body reset",
    description:
      "Our signature full-body massage, with pressure tailored to you. Ask the front desk what today's session includes.",
  },
  {
    id: "couple-massage",
    category: "couple",
    tag: "FOR TWO",
    title: "Couple Massage",
    subtitle: "Two guests, two therapists, side by side in one room.",
    options: [
      { minutes: 45, price: 5000 },
      { minutes: 60, price: 8000 },
      { minutes: 90, price: 10000 },
    ],
    image: "/images/menu-couple-massage.jpg",
    pressure: "Set for each guest",
    bestFor: "Couples, anniversaries",
    forTwo: true,
    description:
      "A massage for two, side by side in the same room, each with their own therapist and their own pressure. Price is for both guests.",
  },
  {
    id: "couple-jacuzzi",
    category: "couple",
    tag: "FOR TWO · JACUZZI",
    title: "Couple Massage with Jacuzzi",
    subtitle: "A couple massage with time in the jacuzzi.",
    options: [
      { minutes: 60, price: 8000 },
      { minutes: 90, price: 12000 },
    ],
    image: "/images/menu-couple-jacuzzi.jpg",
    pressure: "Set for each guest",
    bestFor: "Special occasions",
    forTwo: true,
    description:
      "Our couple massage with jacuzzi time added — the full experience for two. Price is for both guests.",
  },
  {
    id: "four-hand",
    category: "specials",
    tag: "TWO THERAPISTS",
    title: "Four Hand Massage",
    subtitle: "Two therapists working in sync on one guest.",
    options: [
      { minutes: 45, price: 4000 },
      { minutes: 60, price: 6000 },
      { minutes: 90, price: 8000 },
    ],
    image: "/images/menu-four-hand.jpg",
    pressure: "Medium",
    bestFor: "Deep relaxation",
    description:
      "Two therapists massage you at the same time in matched, mirrored strokes — twice the hands, and a depth of relaxation a single therapist can't reach.",
  },
  {
    id: "body-scrub",
    category: "specials",
    tag: "30 MIN",
    title: "Body Scrub",
    subtitle: "A full-body exfoliation for smooth, fresh skin.",
    options: [{ minutes: 30, price: 2000 }],
    image: "/images/menu-body-scrub.jpg",
    pressure: "Gentle exfoliation",
    bestFor: "Dull or dry skin",
    description:
      "A full-body scrub that buffs away dead skin and leaves it smooth and fresh. Works on its own or before any massage.",
  },
];

export const COMPLETE_SPA_DATA: SpaTreatmentData[] = MENU.map((entry) => {
  const lowest = Math.min(...entry.options.map((o) => o.price));
  return {
    ...entry,
    duration: `${entry.options.map((o) => o.minutes).join(" / ")} Min`,
    price: entry.options.length > 1 ? `From ${formatRupees(lowest)}` : formatRupees(lowest),
  };
});
