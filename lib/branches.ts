/**
 * The two branches of Alexa Unisex Salon & Body Spa. Safe for the browser:
 * nothing here is secret.
 *
 * Address, map, rating and hours are from each branch's Justdial listing
 * (Oct 2026).
 */

export const BRAND = {
  name: "Alexa Salon & Spa",
  fullName: "Alexa Unisex Salon & Body Spa",
  tagline: "Pure Professional Family Spa",
};

export type BranchId = "sangli" | "karad";

export interface Branch {
  id: BranchId;
  name: string;
  city: string;
  /** Short prefix on booking references: SNG-4F2K9C. */
  refPrefix: string;
  /** Office number, 10 digits, no +91. */
  phone: string | null;
  /** WhatsApp number, 10 digits, no +91. */
  whatsapp: string | null;
  address: string | null;
  /** Google Maps link for "Get directions". */
  mapsUrl: string | null;
  /** Map position, for search engines. */
  geo: { lat: number; lng: number } | null;
  postalCode: string;
  /** Public rating, as shown on the listing it came from. */
  rating: { score: number; count: number; source: string; url: string } | null;
  /** Month and year the branch opened, e.g. "Nov 2023". */
  since: string | null;
  /** Closing time, 24-hour "HH:MM", India time. Hours as listed on Justdial. */
  closesAt: string;
}

export const BRANCHES: Record<BranchId, Branch> = {
  sangli: {
    id: "sangli",
    name: "Alexa Salon & Spa, Sangli",
    city: "Sangli",
    refPrefix: "SNG",
    phone: "7420085018",
    whatsapp: "7420085018",
    address:
      "2nd Floor, Center 1 Building, opp. Sangli District Court, near Auram Cinema, Vijaynagar Phata, Sangli 416415",
    mapsUrl: "https://www.google.com/maps?q=16.843847,74.610004",
    geo: { lat: 16.843847, lng: 74.610004 },
    postalCode: "416415",
    rating: {
      score: 5.0,
      count: 8,
      source: "Justdial",
      url: "https://www.justdial.com/Sangli/ALEXA-UNISEX-SALON-BODY-SPA-Opp-Sangli-District-Court-Near-Auram-Cinema-Vijaynagar/9999PX233-X233-260908164934-X6X7_BZDET",
    },
    since: null,
    closesAt: "20:00",
  },
  karad: {
    id: "karad",
    name: "Alexa Salon & Spa, Karad",
    city: "Karad",
    refPrefix: "KRD",
    phone: "9209831976",
    whatsapp: "9209831976",
    address:
      "Near Bank of Maharashtra, Malkapur Phata, NH4 Kolhapur Road (opp. Krishna Hospital), Malkapur, Karad 415539",
    mapsUrl: "https://www.google.com/maps?q=17.2580384,74.1775719",
    geo: { lat: 17.2580384, lng: 74.1775719 },
    postalCode: "415539",
    rating: {
      score: 4.9,
      count: 258,
      source: "Justdial",
      url: "https://www.justdial.com/Karad/Alexa-Unisex-Saloon-and-Body-Spa-Datta-Chowk-Karad/9999P2164-2164-240119111326-K7C2_BZDET",
    },
    since: "Nov 2023",
    closesAt: "21:00",
  },
};

export const BRANCH_LIST: Branch[] = [BRANCHES.sangli, BRANCHES.karad];

export function isBranchId(value: unknown): value is BranchId {
  return value === "sangli" || value === "karad";
}

/** Both branches open at the same time, 7 days a week. 24-hour "HH:MM",
    India time. Each branch's closing time is on the branch. */
export const OPENS_AT = "10:00";

/** Start times a guest can pick. A slot is only offered when the chosen
    therapy finishes by the branch's closing time. */
export const SLOT_TIMES = ["10:30", "12:00", "14:00", "15:30", "17:00", "18:30", "20:00", "21:15"];

export function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function slotFits(slot: string, therapyMinutes: number, branch: BranchId): boolean {
  return minutesOfDay(slot) + therapyMinutes <= minutesOfDay(BRANCHES[branch].closesAt);
}

/** "14:00" → "2:00 PM" */
export function formatSlot(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "10:00 AM – 8:00 PM" */
export function branchHours(branch: BranchId): string {
  return `${formatSlot(OPENS_AT)} – ${formatSlot(BRANCHES[branch].closesAt)}`;
}

/** How far ahead a guest may book. */
export const MAX_DAYS_AHEAD = 60;

/** A paid booking cancelled at least this long before its start is refunded
    in full. A business decision for the owner — the refund policy page and
    online cancellation both read it. */
export const CANCEL_HOURS = 4;
