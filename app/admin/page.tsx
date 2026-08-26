"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Users,
  Sparkles,
  Package,
  Award,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  MessageCircle,
  Search,
  Bot,
  Square,
  Volume2,
  RefreshCw,
  Zap,
  CheckCircle2,
  Mic,
  MicOff,
  ChevronRight,
  ShieldAlert,
  Phone,
  UserCheck,
  Plus,
  Coffee,
  Check,
  Send,
  SlidersHorizontal,
  Bell,
  X,
} from "lucide-react";

import TodayCard from "@/components/admin/TodayCard";
import AIFastCheckInModal from "@/components/admin/AIFastCheckInModal";
import VisualSuiteMatrix from "@/components/admin/VisualSuiteMatrix";
import { LANGUAGE_LABELS, useOwnerLanguage, useSpeech, useDictation } from "@/components/admin/OwnerVoice";
import {
  getStoredLiveBookings,
  BOOKINGS_BROADCAST_CHANNEL,
  BOOKINGS_STORAGE_KEY,
  saveBookingRequest,
  makeReference,
} from "@/lib/bookings";
import { playLuxuryBookingChime } from "@/lib/sound";

// Mock Active Today Appointments (including 5 Live Highlighted Online Web Bookings)
const INITIAL_APPOINTMENTS = [
  {
    id: "ALX-WEB01",
    name: "Radhika Merchant",
    phone: "98200 44119",
    therapy: "Signature Balinese Aromatherapy (60m)",
    time: "03:30 PM",
    room: "Single En-Suite 01",
    therapist: "Maya Devi",
    amount: "₹2,239",
    status: "Confirmed",
    oil: "French Lavender — deep relaxation",
    isNewOnlineBooking: true,
    notes: "Booked via public website. Promo FIRST20 (-20%). Prefers gentle pressure.",
  },
  {
    id: "ALX-WEB02",
    name: "Anant Ambani",
    phone: "98201 55228",
    therapy: "Deep Tissue & Volcanic Knot Release (90m)",
    time: "05:00 PM",
    room: "Single En-Suite 02",
    therapist: "Pooja Sharma",
    amount: "₹3,200",
    status: "Confirmed",
    oil: "Alpine Eucalyptus & Camphor",
    isNewOnlineBooking: true,
    notes: "Booked online. Focus on upper spine and neck knot release with hot stones.",
  },
  {
    id: "ALX-WEB03",
    name: "Deepika Padukone",
    phone: "98300 77112",
    therapy: "24K Gold Cellular Renewal Facial (60m)",
    time: "02:00 PM",
    room: "Facial Suite 03",
    therapist: "Sunita Kumari",
    amount: "₹2,999",
    status: "Confirmed",
    oil: "White Rose & Gold Serum",
    isNewOnlineBooking: true,
    notes: "Booked via luxury concierge. Private facial suite reserved.",
  },
  {
    id: "ALX-WEB04",
    name: "Ranveer Singh",
    phone: "98209 88334",
    therapy: "Athletic Deep Muscle Recovery (90m)",
    time: "06:30 PM",
    room: "Single En-Suite 01",
    therapist: "Pooja Sharma",
    amount: "₹3,499",
    status: "Confirmed",
    oil: "Alpine Pine & Eucalyptus",
    isNewOnlineBooking: true,
    notes: "Post-workout recovery. Needs deep fascial stretch and hot shower kit.",
  },
  {
    id: "ALX-WEB05",
    name: "Mira Rajput & Partner",
    phone: "98199 11445",
    therapy: "Royal Couple Rejuvenation Suite (90m)",
    time: "08:00 PM",
    room: "VIP Couple Suite",
    therapist: "Maya Devi & Deepak R.",
    amount: "₹4,999",
    status: "Confirmed",
    oil: "Kashmir Lavender & Rose",
    isNewOnlineBooking: true,
    notes: "Anniversary couple booking via online portal. Hydro bath prepared.",
  },
  {
    id: "ALX-918231",
    name: "Vikram Malhotra",
    phone: "98201 44552",
    therapy: "Deep Tissue & Volcanic Knot Release (60m)",
    time: "10:30 AM",
    room: "Single En-Suite 01",
    therapist: "Pooja Sharma",
    amount: "₹2,499",
    status: "Completed",
    oil: "Alpine Eucalyptus",
    isNewOnlineBooking: false,
  },
  {
    id: "ALX-827361",
    name: "Ananya & Rohan Kapoor",
    phone: "99302 11883",
    therapy: "Royal Couple Rejuvenation Suite (90m)",
    time: "11:30 AM",
    room: "VIP Couple Suite",
    therapist: "Maya Devi & Deepak R.",
    amount: "₹4,999",
    status: "Checked In",
    oil: "French Lavender & Rose",
    isNewOnlineBooking: false,
  },
  {
    id: "ALX-762910",
    name: "Dr. Siddharth Verma",
    phone: "98199 00213",
    therapy: "Heated Volcanic Basalt Spine (75m)",
    time: "01:00 PM",
    room: "Single En-Suite 02",
    therapist: "Pooja Sharma",
    amount: "₹2,999",
    status: "Confirmed",
    oil: "Warm Juniper & Cedar",
    isNewOnlineBooking: false,
  },
  {
    id: "ALX-661902",
    name: "Meera Sen",
    phone: "97690 33412",
    therapy: "24K Gold Cellular Renewal Facial (60m)",
    time: "02:30 PM",
    room: "Facial Suite 03",
    therapist: "Sunita Kumari",
    amount: "₹2,999",
    status: "Confirmed",
    oil: "White Rose Nectar",
    isNewOnlineBooking: false,
  },
  {
    id: "ALX-551029",
    name: "Karan Johar (Producer)",
    phone: "98210 99881",
    therapy: "Signature Balinese Aromatherapy (90m)",
    time: "04:00 PM",
    room: "Single En-Suite 01",
    therapist: "Maya Devi",
    amount: "₹3,499",
    status: "Confirmed",
    oil: "Sweet Ylang Ylang",
    isNewOnlineBooking: false,
  },
  {
    id: "ALX-442190",
    name: "Rohit Shetty (Builder)",
    phone: "98200 88771",
    therapy: "Athletic Deep Muscle Recovery (90m)",
    time: "05:30 PM",
    room: "Single En-Suite 02",
    therapist: "Pooja Sharma",
    amount: "₹3,499",
    status: "Confirmed",
    oil: "Alpine Pine & Eucalyptus",
    isNewOnlineBooking: false,
  },
  {
    id: "ALX-331980",
    name: "Kavita Desai",
    phone: "98190 77665",
    therapy: "Kashmir Lavender Sound-Bath Massage (75m)",
    time: "07:00 PM",
    room: "Single En-Suite 01",
    therapist: "Maya Devi",
    amount: "₹2,799",
    status: "Confirmed",
    oil: "Kashmir Lavender",
    isNewOnlineBooking: false,
  },
  {
    id: "ALX-220192",
    name: "Manish Malhotra & Partner",
    phone: "99880 11223",
    therapy: "VIP Obsidian Sanctuary Suite Ritual (120m)",
    time: "08:30 PM",
    room: "VIP Couple Suite",
    therapist: "Maya Devi & Deepak R.",
    amount: "₹6,999",
    status: "Confirmed",
    oil: "Rare Agarwood Oudh",
    isNewOnlineBooking: false,
  },
];

// Rich 1-Month Customer CRM Dataset
const INITIAL_CUSTOMERS = [
  {
    id: "CUST-01",
    name: "Vikram Malhotra",
    phone: "+91 98201 44552",
    visits: 14,
    totalSpent: "₹38,900",
    tier: "Black Obsidian VIP",
    preferredOil: "Alpine Eucalyptus",
    pressure: "Deep Athletic Pressure",
    notes: "Senior Managing Director. Chronic lumbar stiffness from long flights. Prefers 55°C extra hot basalt stones.",
    lastVisit: "Today",
    segment: "obsidian",
  },
  {
    id: "CUST-02",
    name: "Ananya Kapoor",
    phone: "+91 99302 11883",
    visits: 8,
    totalSpent: "₹26,500",
    tier: "Gold VIP Member",
    preferredOil: "French Lavender",
    pressure: "Medium Relaxing",
    notes: "Anniversary visit with spouse. Loves complimentary organic herbal tea after session. Highly sensitive skin.",
    lastVisit: "Today",
    segment: "gold",
  },
  {
    id: "CUST-03",
    name: "Ramesh Aggarwal",
    phone: "+91 98200 99112",
    visits: 19,
    totalSpent: "₹54,000",
    tier: "Black Obsidian VIP",
    preferredOil: "Thai Lemongrass",
    pressure: "Deep Athletic Pressure",
    notes: "Every Saturday 11 AM fixed regular. Needs quiet room, zero conversation, maximum scalp acupressure focus.",
    lastVisit: "3 days ago",
    segment: "obsidian",
  },
  {
    id: "CUST-04",
    name: "Dr. Siddharth Verma",
    phone: "+91 98199 00213",
    visits: 11,
    totalSpent: "₹32,400",
    tier: "Black Obsidian VIP",
    preferredOil: "Warm Basalt & Juniper",
    pressure: "Firm Deep Pressure",
    notes: "Orthopedic Surgeon. Upper spine & cervical tension. Always books 75m heated stone therapy with therapist Pooja.",
    lastVisit: "Today",
    segment: "obsidian",
  },
  {
    id: "CUST-05",
    name: "Meera Sen",
    phone: "+91 97690 33412",
    visits: 6,
    totalSpent: "₹17,990",
    tier: "Gold VIP Member",
    preferredOil: "White Rose Nectar",
    pressure: "Light & Gentle Soothing",
    notes: "Fashion Influencer. Focus on 24K Gold Cellular facial renewal & lymph drainage. Prefers soft 432Hz ambient sound.",
    lastVisit: "Today",
    segment: "gold",
  },
  {
    id: "CUST-06",
    name: "Karan Johar",
    phone: "+91 98210 99881",
    visits: 15,
    totalSpent: "₹46,800",
    tier: "Black Obsidian VIP",
    preferredOil: "Sweet Ylang Ylang",
    pressure: "Medium Relaxing",
    notes: "Media Producer. High stress, insomnia relief. Prefers late evening slots after 6 PM in private En-Suite 01.",
    lastVisit: "Today",
    segment: "obsidian",
  },
  {
    id: "CUST-07",
    name: "Priya Sundaram",
    phone: "+91 98701 22334",
    visits: 2,
    totalSpent: "₹4,800",
    tier: "Silver Member",
    preferredOil: "Cold-Pressed Jojoba",
    pressure: "Gentle Relaxing",
    notes: "Tried Swedish massage last month. Interested in afternoon happy hour privileges.",
    lastVisit: "38 days ago (Lapsed)",
    segment: "lapsed",
  },
  {
    id: "CUST-08",
    name: "Advocate Rajesh Singhania",
    phone: "+91 98205 11332",
    visits: 12,
    totalSpent: "₹36,200",
    tier: "Black Obsidian VIP",
    preferredOil: "Bergamot & Mint",
    pressure: "Deep Muscle Pressure",
    notes: "High Court Lawyer. Focus on shoulder knot release and hot towel compresses. Books every 2 weeks.",
    lastVisit: "5 days ago",
    segment: "obsidian",
  },
  {
    id: "CUST-09",
    name: "Kavita Desai",
    phone: "+91 98190 77665",
    visits: 7,
    totalSpent: "₹22,100",
    tier: "Gold VIP Member",
    preferredOil: "Kashmir Lavender",
    pressure: "Medium Relaxing",
    notes: "Interior Architect. Loves aromatherapy diffuser blend and Tibetan singing bowl resonance prior to massage.",
    lastVisit: "Today",
    segment: "gold",
  },
  {
    id: "CUST-10",
    name: "Aarav Mehta",
    phone: "+91 98330 44556",
    visits: 3,
    totalSpent: "₹7,490",
    tier: "Silver Member",
    preferredOil: "Sweet Orange & Cedar",
    pressure: "Medium Pressure",
    notes: "IT Consultant. Came for shoulder strain. Prime candidate for monthly wellness subscription.",
    lastVisit: "42 days ago (Lapsed)",
    segment: "lapsed",
  },
  {
    id: "CUST-11",
    name: "Rohit Shetty (Builder)",
    phone: "+91 98200 88771",
    visits: 16,
    totalSpent: "₹51,200",
    tier: "Black Obsidian VIP",
    preferredOil: "Sandalwood & Cedar",
    pressure: "Extra Deep Athletic",
    notes: "Real Estate Developer. Athletic workouts cause hamstring tightness. Prefers 90m deep tissue + basalt stone finish.",
    lastVisit: "Today",
    segment: "obsidian",
  },
  {
    id: "CUST-12",
    name: "Aditi Rao",
    phone: "+91 98209 33557",
    visits: 2,
    totalSpent: "₹4,998",
    tier: "Silver Member",
    preferredOil: "French Lavender",
    pressure: "Light & Soothing",
    notes: "Visited 45 days ago for birthday gift voucher. Send 25% anniversary re-engagement offer.",
    lastVisit: "45 days ago (Lapsed)",
    segment: "lapsed",
  },
];

// Rich Botanical Inventory Dataset
const INITIAL_INVENTORY = [
  { id: "inv-1", name: "Alpine Eucalyptus Essential Oil", stock: "0.4 Liters", status: "LOW STOCK", reorder: "0.5L", burnRate: "45ml/session", daysLeft: "1.5 Days" },
  { id: "inv-2", name: "French Lavender & Chamomile Oil", stock: "1.8 Liters", status: "Healthy", reorder: "1.0L", burnRate: "50ml/session", daysLeft: "8.0 Days" },
  { id: "inv-3", name: "Rare Agarwood Oudh Master Blend", stock: "0.6 Liters", status: "Healthy", reorder: "0.3L", burnRate: "20ml/session", daysLeft: "14.0 Days" },
  { id: "inv-4", name: "Virgin Cold-Pressed Jojoba Oil", stock: "3.2 Liters", status: "Healthy", reorder: "1.5L", burnRate: "120ml/session", daysLeft: "12.0 Days" },
  { id: "inv-5", name: "Disposable Linen & Innerwear Kits", stock: "82 Sets", status: "Healthy", reorder: "30 Sets", burnRate: "12 sets/day", daysLeft: "6.8 Days" },
  { id: "inv-6", name: "24K Gold Cellular Serum Vials", stock: "4 Vials", status: "LOW STOCK", reorder: "6 Vials", burnRate: "1 vial/facial", daysLeft: "2.0 Days" },
];

// Complete Staff & Therapist Roster
const INITIAL_STAFF = [
  {
    id: "staff-01",
    name: "Pooja Sharma",
    role: "Senior Master Therapist",
    phone: "+91 98201 11223",
    status: "In Session (En-Suite 01)",
    shift: "10:00 AM - 07:00 PM",
    sessionsToday: 6,
    sessionsMonth: 112,
    grossToday: "₹14,800",
    commissionToday: "₹1,480",
    rating: "4.95 ★",
    specialty: "Deep Tissue & Heated Volcanic Basalt",
    fatigueIndex: "High (4 Deep Tissue)",
    breakStatus: "Break Needed (03:30 PM)",
    tipsMonth: "₹6,400",
    attendance: "Present (On-Time)",
  },
  {
    id: "staff-02",
    name: "Maya Devi",
    role: "Master Balinese & Thai Specialist",
    phone: "+91 98202 22334",
    status: "In Session (VIP Couple Suite)",
    shift: "11:00 AM - 08:00 PM",
    sessionsToday: 5,
    sessionsMonth: 98,
    grossToday: "₹12,490",
    commissionToday: "₹1,249",
    rating: "4.90 ★",
    specialty: "Balinese Aromatherapy & Couple Rituals",
    fatigueIndex: "Moderate",
    breakStatus: "Break Scheduled (05:30 PM)",
    tipsMonth: "₹5,200",
    attendance: "Present (On-Time)",
  },
  {
    id: "staff-03",
    name: "Deepak Rawat",
    role: "Male Therapist & Couple Suite Specialist",
    phone: "+91 98203 33445",
    status: "Available (Standby)",
    shift: "12:00 PM - 09:00 PM",
    sessionsToday: 4,
    sessionsMonth: 86,
    grossToday: "₹9,800",
    commissionToday: "₹980",
    rating: "4.85 ★",
    specialty: "Swedish Serenity & Muscle Recovery",
    fatigueIndex: "Optimal",
    breakStatus: "Refreshed",
    tipsMonth: "₹4,100",
    attendance: "Present (On-Time)",
  },
  {
    id: "staff-04",
    name: "Sunita Kumari",
    role: "Senior Aesthetician & Facialist",
    phone: "+91 98204 44556",
    status: "Available (Facial Suite 03)",
    shift: "10:00 AM - 07:00 PM",
    sessionsToday: 3,
    sessionsMonth: 74,
    grossToday: "₹8,997",
    commissionToday: "₹900",
    rating: "4.92 ★",
    specialty: "24K Gold Facial & Lymphatic Drainage",
    fatigueIndex: "Optimal",
    breakStatus: "Refreshed",
    tipsMonth: "₹4,800",
    attendance: "Present (On-Time)",
  },
  {
    id: "staff-05",
    name: "Ananya Roy",
    role: "Certified Aromatherapist",
    phone: "+91 98205 55667",
    status: "In Session (En-Suite 02)",
    shift: "01:00 PM - 10:00 PM",
    sessionsToday: 4,
    sessionsMonth: 68,
    grossToday: "₹10,200",
    commissionToday: "₹1,020",
    rating: "4.88 ★",
    specialty: "Kashmir Lavender Sound-Bath & Steam",
    fatigueIndex: "Moderate",
    breakStatus: "Break Scheduled (06:00 PM)",
    tipsMonth: "₹3,900",
    attendance: "Present (On-Time)",
  },
  {
    id: "staff-06",
    name: "Vikramaditya Rao",
    role: "Ayurvedic Panchakarma Specialist",
    phone: "+91 98206 66778",
    status: "Available (Standby)",
    shift: "02:00 PM - 10:00 PM",
    sessionsToday: 2,
    sessionsMonth: 54,
    grossToday: "₹5,400",
    commissionToday: "₹540",
    rating: "4.96 ★",
    specialty: "Abhyanga & Scalp Acupressure",
    fatigueIndex: "Optimal",
    breakStatus: "Refreshed",
    tipsMonth: "₹3,100",
    attendance: "Present (On-Time)",
  },
  {
    id: "staff-07",
    name: "Kavita Joshi",
    role: "Front Desk & Guest Concierge Manager",
    phone: "+91 98207 77889",
    status: "Active on Reception",
    shift: "09:30 AM - 06:30 PM",
    sessionsToday: 0,
    sessionsMonth: 0,
    grossToday: "₹48,980 (Booked)",
    commissionToday: "₹1,200 (Bonus)",
    rating: "4.98 ★",
    specialty: "Fast Check-In & WhatsApp Concierge",
    fatigueIndex: "Optimal",
    breakStatus: "Active",
    tipsMonth: "₹2,500",
    attendance: "Present (On-Time)",
  },
];

interface CopilotResponse {
  headline: string;
  directAnswer: string;
  kpiSummary: { label: string; value: string; subtext: string; status: "good" | "warning" | "alert" }[];
  anomalies: { title: string; description: string; severity: "high" | "medium" | "low"; entity: string }[];
  actionPlan: {
    id: string;
    title: string;
    action: string;
    rationale: string;
    urgency: "immediate" | "today" | "this_week";
    impact: string;
    targetEntity?: string;
    actionType: "fill_slot" | "contact_vip" | "reorder_stock" | "staff_break" | "general";
  }[];
  spoken: string;
}

const COPILOT_PRESETS = [
  {
    id: "all_operations",
    label: "⚡ Full Operations & Revenue Audit",
    hint: "Cross-analyzes appointments, VIP churn, inventory & staff loads",
    intent: "all_operations" as const,
  },
  {
    id: "schedule_gaps",
    label: "📅 Suite Gaps & Yield Optimizer",
    hint: "Identify idle suite hours & calculate uncaptured revenue",
    intent: "schedule_gaps" as const,
  },
  {
    id: "vip_churn",
    label: "👑 VIP Churn & LTV Retention Radar",
    hint: "Flag inactive Black Obsidian VIPs and generate targeted retention plans",
    intent: "vip_churn" as const,
  },
  {
    id: "inventory_depletion",
    label: "🌿 Oil Stock Velocity & Depletion Forecast",
    hint: "Predict stockout risks for Eucalyptus, Oudh and Lavender",
    intent: "inventory_depletion" as const,
  },
  {
    id: "therapist_fatigue",
    label: "👩‍💼 Therapist Fatigue & Workload Balancer",
    hint: "Detect heavy physical session clusters and schedule hydro-breaks",
    intent: "therapist_fatigue" as const,
  },
];

interface CampaignPreset {
  id: string;
  title: string;
  desc: string;
  occasion: string;
  goal: string;
}

const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: "inactive",
    title: "Guests who haven't been back",
    desc: "Thirty days or more since their last visit (6 guests flagged)",
    occasion: "winning back guests who have not visited in over a month",
    goal: "get lapsed guests to rebook this week",
  },
  {
    id: "rain",
    title: "Monsoon escape",
    desc: "Push heated basalt and steam",
    occasion: "Mumbai monsoon season",
    goal: "promote heated stone and steam treatments in wet weather",
  },
  {
    id: "happyhour",
    title: "Weekday afternoons",
    desc: "Fill the 11am–4pm trough",
    occasion: "weekday happy hours, Monday to Thursday 11:00 to 16:00",
    goal: "fill weekday afternoon slots that usually run empty",
  },
];

interface Insights {
  headline: string;
  spoken?: string;
  metrics: { label: string; value: string; note: string }[];
  findings: string[];
  actions: { action: string; why: string; effort: string; impact: string }[];
  risks: string[];
  sampleSize: number;
}


export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [language, setLanguage] = useOwnerLanguage();
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [crmSegment, setCrmSegment] = useState<string>("all");
  const [isAICheckInOpen, setIsAICheckInOpen] = useState<boolean>(false);

  // Live Toast Notification for real-time bookings from public website
  const [liveToast, setLiveToast] = useState<{
    id: string;
    name: string;
    therapy: string;
    time: string;
    amount: string;
    room: string;
  } | null>(null);

  // Copilot State
  const [copilotBusy, setCopilotBusy] = useState<boolean>(false);
  const [copilotError, setCopilotError] = useState<string>("");
  const [activePreset, setActivePreset] = useState<string>("all_operations");
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [copilotData, setCopilotData] = useState<CopilotResponse | null>(null);

  const copilotSpeech = useSpeech(language);

const [campaignPrompt, setCampaignPrompt] = useState<string>("");
  const [campaignBrief, setCampaignBrief] = useState<string>("");
  const [generatedCampaign, setGeneratedCampaign] = useState<string>("");
  const [campaignMeta, setCampaignMeta] = useState<{
    promoCode?: string;
    bestTimeToSend?: string;
  } | null>(null);
  const [campaignBusy, setCampaignBusy] = useState<boolean>(false);
  const [campaignError, setCampaignError] = useState<string>("");
  const [campaignCopied, setCampaignCopied] = useState<boolean>(false);

  const [reviewText, setReviewText] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewReply, setReviewReply] = useState<string>("");
  const [reviewIssues, setReviewIssues] = useState<string[]>([]);
  const [reviewBusy, setReviewBusy] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>("");

  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsQuestion, setInsightsQuestion] = useState<string>("");
  const [insightsBusy, setInsightsBusy] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<string>("");

  /* The analysis is long. An owner who does not read English business prose can
     press one button and hear the whole thing instead. */
  const insightsSpeech = useSpeech(language);

  const runCampaign = async (preset: CampaignPreset) => {
    if (!preset.occasion.trim()) return;
    setCampaignPrompt(preset.id);
    setCampaignBusy(true);
    setCampaignError("");
    try {
      const response = await fetch("/api/ai/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion: preset.occasion, goal: preset.goal, language }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCampaignError(data?.error ?? "Couldn't write that.");
        return;
      }
      setGeneratedCampaign(data.message);
      setCampaignMeta({ promoCode: data.promoCode, bestTimeToSend: data.bestTimeToSend });
    } catch {
      setCampaignError("Couldn't reach the writer.");
    } finally {
      setCampaignBusy(false);
    }
  };

  const runReviewReply = async () => {
    setReviewBusy(true);
    setReviewError("");
    try {
      const response = await fetch("/api/ai/review-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review: reviewText, rating: reviewRating, language }),
      });
      const data = await response.json();
      if (!response.ok) {
        setReviewError(data?.error ?? "Couldn't draft that.");
        return;
      }
      setReviewReply(data.reply);
      setReviewIssues(data.issues ?? []);
    } catch {
      setReviewError("Couldn't reach the writer.");
    } finally {
      setReviewBusy(false);
    }
  };

  const runInsights = async () => {
    setInsightsBusy(true);
    setInsightsError("");
    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: insightsQuestion, language }),
      });
      const data = await response.json();
      if (!response.ok || data?.error) {
        setInsightsError(data?.error ?? "Couldn't analyse that.");
        return;
      }
      setInsights(data as Insights);
    } catch {
      setInsightsError("Couldn't reach the analyst.");
    } finally {
      setInsightsBusy(false);
    }
  };
  
  const dictation = useDictation(language, setCustomQuestion);

  // 1. Initial Load & Multi-Layer Real-Time Sync Listeners
  useEffect(() => {
    // Handler when a new booking arrives from the public site
    const handleIncomingBooking = (newApp: any) => {
      playLuxuryBookingChime();
      setLiveToast({
        id: newApp.id,
        name: newApp.name,
        therapy: newApp.therapy,
        time: newApp.time,
        amount: newApp.amount,
        room: newApp.room,
      });

      setAppointments((prev) => {
        const exists = prev.some((a) => a.id === newApp.id);
        if (exists) return prev;
        return [{ ...newApp, isNewOnlineBooking: true }, ...prev];
      });

      // Add to CRM if new guest
      setCustomers((prev) => {
        if (prev.some((c) => c.phone.includes(newApp.phone.slice(-6)))) return prev;
        return [
          {
            id: `CUST-${Date.now().toString().slice(-4)}`,
            name: newApp.name,
            phone: `+91 ${newApp.phone}`,
            visits: 1,
            totalSpent: newApp.amount,
            tier: "Silver Member",
            preferredOil: newApp.oil || "Alpine Eucalyptus",
            pressure: "Medium Relaxing",
            notes: `Online booking on ${new Date().toLocaleDateString("en-IN")}. Notes: ${newApp.notes || "None"}`,
            lastVisit: "Today",
            segment: "gold",
          },
          ...prev,
        ];
      });
    };

    // 1A. Load any persisted live online bookings from localStorage
    const stored = getStoredLiveBookings();
    if (stored && stored.length > 0) {
      setAppointments((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newOnes = stored.filter((s: any) => !existingIds.has(s.id));
        return [...newOnes, ...prev];
      });
    }

    // 1B. BroadcastChannel sync across browser tabs
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel(BOOKINGS_BROADCAST_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === "NEW_BOOKING" && event.data.appointment) {
          handleIncomingBooking(event.data.appointment);
        }
      };
    }

    // 1C. Local custom event listener
    const localListener = (e: any) => {
      if (e.detail) {
        handleIncomingBooking(e.detail);
      }
    };
    window.addEventListener("alexa:new-booking", localListener);

    // 1D. Storage event listener (fires when another tab updates localStorage)
    const storageListener = (e: StorageEvent) => {
      if (e.key === BOOKINGS_STORAGE_KEY && e.newValue) {
        try {
          const list = JSON.parse(e.newValue);
          if (Array.isArray(list) && list.length > 0) {
            handleIncomingBooking(list[0]);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", storageListener);

    // 1E. Active 3-Second Server Polling (Fetches from /api/bookings across all devices)
    const pollServerBookings = async () => {
      try {
        const res = await fetch("/api/bookings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.bookings) && data.bookings.length > 0) {
            data.bookings.forEach((serverApp: any) => {
              setAppointments((current) => {
                const alreadyExists = current.some((a) => a.id === serverApp.id);
                if (!alreadyExists) {
                  // Play Chime and Show Toast
                  playLuxuryBookingChime();
                  setLiveToast({
                    id: serverApp.id,
                    name: serverApp.name,
                    therapy: serverApp.therapy,
                    time: serverApp.time,
                    amount: serverApp.amount,
                    room: serverApp.room,
                  });
                  return [{ ...serverApp, isNewOnlineBooking: true }, ...current];
                }
                return current;
              });
            });
          }
        }
      } catch (err) {
        // Silently retry on next poll cycle
      }
    };

    pollServerBookings();
    const pollInterval = setInterval(pollServerBookings, 3000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("alexa:new-booking", localListener);
      window.removeEventListener("storage", storageListener);
      clearInterval(pollInterval);
    };
  }, []);

  const handleAddNewAppointment = (newApp: any) => {
    setAppointments((prev) => [newApp, ...prev]);
  };

  const handleSimulateTestBooking = async (guestPreset?: { name: string; phone: string; therapy: string; price: number; time: string }) => {
    const defaultPreset = guestPreset || {
      name: "Radhika Merchant",
      phone: "98200 44119",
      therapy: "Signature Balinese Aromatherapy",
      price: 2799,
      time: "03:30 PM",
    };

    const ref = makeReference();
    await saveBookingRequest({
      reference: ref,
      therapy_slug: "balinese-aromatherapy",
      therapy_name: defaultPreset.therapy,
      duration: "60 Min",
      requested_date: new Date().toISOString().split("T")[0],
      requested_time: defaultPreset.time,
      guest_name: defaultPreset.name,
      guest_phone: defaultPreset.phone,
      guest_email: "guest@example.com",
      guest_notes: "Prefers warm lavender oil and gentle shoulder pressure.",
      therapist_preference: "female",
      room_type: "single",
      aroma_oil: "French Lavender — deep relaxation",
      list_price_inr: defaultPreset.price,
      discount_percent: 20,
      final_price_inr: Math.round(defaultPreset.price * 0.8),
      promo_code: "FIRST20",
    });
  };

  const handleFillSuiteWithAI = (suiteName: string) => {
    setActiveTab("copilot");
    runCopilotQuery("schedule_gaps", `How to fill the idle gap in ${suiteName} today?`);
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const handleSendReminderWhatsApp = (app: any) => {
    const text = `Hi ${app.name}! This is a gentle reminder from *Alexa Spa* for your appointment today at *${app.time}* for *${app.therapy}*.\n\nRoom: ${app.room}\nTherapist: ${app.therapist}\nAddress: 2nd Floor, Grand Plaza.\n\nValet parking is available. Reply *YES* to confirm!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/91${app.phone.replace(/\s+/g, "")}?text=${encoded}`, "_blank");
  };

  const handleSendStaffPayoutWhatsApp = (st: any) => {
    const text = `Hi ${st.name}! Here is your daily performance summary from *Alexa Spa*:\n\nDate: Today\nRole: ${st.role}\nCompleted Sessions: ${st.sessionsToday}\nTotal Gross Generated: ${st.grossToday}\nDaily Commission (10%): *${st.commissionToday}*\nCustomer Rating: ${st.rating}\n\nThank you for your dedicated service today!`;
    window.open(`https://wa.me/${st.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleLogStaffBreak = (staffId: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId ? { ...s, fatigueIndex: "Optimal (Post-Break)", breakStatus: "On Hydro Break (20m)" } : s
      )
    );
    alert("20-Minute Hydro Recovery Break logged in schedule for therapist.");
  };

  // Run Copilot Query against live state
  const runCopilotQuery = async (intent: any = activePreset, queryText: string = customQuestion) => {
    setCopilotBusy(true);
    setCopilotError("");
    setActivePreset(intent);

    try {
      const response = await fetch("/api/ai/operations-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          query: queryText,
          language,
          appointments,
          customers,
          inventory,
          therapists: staff,
        }),
      });

      const data = await response.json();
      if (!response.ok || data?.error) {
        setCopilotError(data?.error ?? "Could not process operational data.");
        return;
      }
      setCopilotData(data as CopilotResponse);
    } catch {
      setCopilotError("Could not reach the operations copilot.");
    } finally {
      setCopilotBusy(false);
    }
  };

  useEffect(() => {
    if (activeTab === "copilot" && !copilotData && !copilotBusy) {
      runCopilotQuery("all_operations");
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#07090b] text-[#f7f4ee] flex flex-col font-sans select-none antialiased relative">
      {/* 
        ========================================================================
        LIVE ONLINE BOOKING NOTIFICATION TOAST (AUDIO CHIME + GLOWING ALERT)
        ========================================================================
      */}
      {liveToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md w-full p-5 rounded-3xl bg-gradient-to-br from-[#1c2836] via-[#121c27] to-[#0a0f14] border-2 border-[#c5a880] shadow-[0_0_50px_rgba(197,168,128,0.45)] animate-bounce text-white space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#c5a880] text-[#07090b] shadow-lg animate-pulse">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#d9bb8e] font-bold block">
                  🔔 NEW ONLINE BOOKING RECEIVED!
                </span>
                <h4 className="text-base font-serif font-bold text-white">
                  {liveToast.name}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono space-y-1">
            <div className="text-neutral-300">✨ {liveToast.therapy}</div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>⏰ {liveToast.time} • 🚪 {liveToast.room}</span>
              <strong className="text-[#d9bb8e] text-sm">{liveToast.amount}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => {
                setActiveTab("appointments");
                setLiveToast(null);
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#c5a880] hover:brightness-110 text-[#07090b] text-xs font-mono font-bold uppercase transition-all shadow-md cursor-pointer text-center"
            >
              View In Appointments →
            </button>
            <button
              onClick={() => setLiveToast(null)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top High-Contrast Executive Header */}
      <header className="bg-[#0c1218] border-b border-white/15 px-6 sm:px-10 py-4 sm:py-5 flex items-center justify-between sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-mono text-[#d9bb8e] hover:text-white transition-colors bg-[#16202a] px-4 py-2 rounded-xl border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">PUBLIC WEBSITE</span>
          </Link>
          <span className="text-white/20 hidden sm:inline">|</span>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-base sm:text-xl font-serif tracking-widest text-white font-bold">
              ALEXA SPA BUSINESS OS
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#c5a880]/20 text-[#d9bb8e] text-xs font-mono font-bold border border-[#c5a880]/30 hidden md:inline">
              BRANCH: GRAND PLAZA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-mono">
          {/* Test Public Booking Trigger Button */}
          <button
            onClick={() => handleSimulateTestBooking()}
            title="Simulates a real-time booking coming from the public website"
            className="px-4 py-2 rounded-full bg-[#182330] hover:bg-[#202f40] text-[#d9bb8e] text-xs font-mono font-bold border border-[#c5a880]/40 flex items-center gap-2 shadow-md transition-all cursor-pointer hidden lg:flex"
          >
            <Zap className="w-3.5 h-3.5 text-[#d9bb8e]" />
            <span>Test Web Booking</span>
          </button>

          {/* AI Quick Check-In CTA Button */}
          <button
            onClick={() => setIsAICheckInOpen(true)}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#c5a880] to-[#e4d3ba] text-[#07090b] text-sm font-sans font-bold uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#c5a880]/25 hover:brightness-110 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI FAST CHECK-IN</span>
            <span className="sm:hidden">CHECK-IN</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center rounded-full border border-white/15 bg-[#121922] p-1 shadow-inner">
            {LANGUAGE_LABELS.map((option) => (
              <button
                key={option.id}
                onClick={() => setLanguage(option.id)}
                title={option.hint}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  language === option.id
                    ? "bg-[#c5a880] font-bold text-[#07090b] shadow-md"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Spacious, High-Legibility Sidebar Nav */}
        <aside className="w-full md:w-72 bg-[#090e13] border-r border-white/15 p-5 sm:p-6 space-y-2.5 shadow-2xl">
          <div className="px-3 pb-3 text-xs font-mono uppercase tracking-[0.2em] text-[#d9bb8e] font-bold">
            OPERATIONAL NAVIGATION
          </div>

          {[
            { id: "dashboard", label: "Revenue & KPI Cockpit", icon: BarChart3 },
            { id: "copilot", label: "AI Operations Copilot", icon: Bot, badge: "LIVE DATA" },
            { id: "automation", label: "AI Marketing & Automation", icon: Send, badge: "AI STUDIO" },
            { id: "appointments", label: "Appointments & Suites", icon: Calendar, badge: `${appointments.length} Booked` },
            { id: "staff", label: "Staff & Therapist CRM", icon: Award, badge: `${staff.length} Active` },
            { id: "customers", label: "Customer CRM & History", icon: Users, badge: `${customers.length} Profiles` },
            { id: "inventory", label: "Oils & Stock Tracker", icon: Package, badge: "6 SKUs" },
          ].map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#c5a880] text-[#07090b] font-bold shadow-xl shadow-[#c5a880]/20 scale-[1.02]"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? "text-[#07090b]" : "text-[#c5a880]"}`} />
                  <span className="leading-snug">{nav.label}</span>
                </div>
                {nav.badge && (
                  <span
                    className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-[#07090b] text-[#c5a880]" : "bg-white/10 text-neutral-300"
                    }`}
                  >
                    {nav.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto space-y-8">
          {/* 
            ====================================================================
            TAB 1: REVENUE & KPI COCKPIT (PERFECTED ORDER & REFINED AESTHETICS)
            ====================================================================
          */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-wide font-bold">
                    Executive Revenue & Business Pulse
                  </h2>
                  <p className="text-sm text-neutral-300 font-mono mt-1">
                    Live financial telemetry for Alexa Spa (Grand Plaza Center, Mumbai)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSimulateTestBooking()}
                    className="px-5 py-3 rounded-full bg-[#16202c] border border-[#c5a880]/40 text-[#d9bb8e] text-xs font-mono font-bold flex items-center gap-2 hover:bg-[#202f40] transition-all cursor-pointer shadow-md"
                  >
                    <Zap className="w-4 h-4 text-[#d9bb8e]" />
                    <span>+ Test Web Booking</span>
                  </button>

                  <button
                    onClick={() => setIsAICheckInOpen(true)}
                    className="px-6 py-3 rounded-full bg-[#c5a880] hover:brightness-110 text-[#07090b] text-sm font-sans font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-[#c5a880]/20 transition-all self-start sm:self-auto"
                  >
                    <Sparkles className="w-4 h-4" /> + Quick Walk-in
                  </button>
                </div>
              </div>

              {/* 1. TOP 4 KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Today's Revenue */}
                <div className="p-6 rounded-3xl bg-[#0c1015] border border-white/10 space-y-2.5 shadow-xl hover:border-[#c5a880]/40 transition-all">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    <span>TODAY'S REVENUE</span>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                    ₹{appointments.reduce((acc, a) => acc + (parseInt(a.amount.replace(/[^0-9]/g, "")) || 0), 0).toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold block">
                    +18.4% vs yesterday ({appointments.length} Bookings)
                  </span>
                </div>

                {/* Card 2: Bed Occupancy */}
                <div className="p-6 rounded-3xl bg-[#0c1015] border border-white/10 space-y-2.5 shadow-xl hover:border-[#c5a880]/40 transition-all">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    <span>BED OCCUPANCY</span>
                    <Clock className="w-5 h-5 text-[#d9bb8e]" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                    84.2%
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold block">
                    2 Afternoon Gaps Detected
                  </span>
                </div>

                {/* Card 3: Avg Ticket Size */}
                <div className="p-6 rounded-3xl bg-[#0c1015] border border-white/10 space-y-2.5 shadow-xl hover:border-[#c5a880]/40 transition-all">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    <span>AVG TICKET SIZE (AOV)</span>
                    <DollarSign className="w-5 h-5 text-[#d9bb8e]" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                    ₹3,120
                  </div>
                  <span className="text-xs font-mono text-[#d9bb8e] font-bold block">
                    Obsidian LTV: ₹44.2k
                  </span>
                </div>

                {/* Card 4: VIP Churn Risk */}
                <div className="p-6 rounded-3xl bg-[#0c1015] border border-white/10 space-y-2.5 shadow-xl hover:border-amber-500/40 transition-all">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    <span>VIP CHURN RISK</span>
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-serif font-bold text-[#d9bb8e] tracking-tight">
                    4 Lapsed
                  </div>
                  <span className="text-xs font-mono text-amber-300 font-bold block">
                    ₹1.84L Pipeline at risk
                  </span>
                </div>
              </div>

              {/* 2. HOURLY REVENUE FLOW & AI DATA AUDIT ACTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Hourly Revenue Flow */}
                <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#0c1015] border border-white/10 space-y-6 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-sm sm:text-base font-mono tracking-wider text-[#d9bb8e] uppercase font-bold">
                      TODAY'S HOURLY REVENUE FLOW
                    </h3>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30 font-bold">
                      Peak: 04 PM - 08 PM
                    </span>
                  </div>

                  <div className="space-y-4 pt-1">
                    {[
                      { slot: "10:00 AM - 12:00 PM (Morning Calm)", amount: "₹12,490", percent: 68 },
                      { slot: "12:00 PM - 02:00 PM (Lunch Slots)", amount: "₹8,990", percent: 48 },
                      { slot: "02:00 PM - 04:00 PM (Afternoon Lull)", amount: "₹6,490", percent: 35 },
                      { slot: "04:00 PM - 07:00 PM (Prime Rush)", amount: "₹15,990", percent: 88 },
                      { slot: "07:00 PM - 10:00 PM (VIP Evening)", amount: "₹18,490", percent: 100 },
                    ].map((h, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-xs sm:text-sm">
                          <span className="text-neutral-300 font-medium">{h.slot}</span>
                          <span className="text-[#d9bb8e] font-bold text-sm sm:text-base">{h.amount}</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#b39369] to-[#d9bb8e] rounded-full transition-all duration-700"
                            style={{ width: `${h.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: AI Data Audit Actions */}
                <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#0c1015] border border-white/10 space-y-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <h3 className="text-sm sm:text-base font-mono tracking-wider text-[#d9bb8e] uppercase font-bold">
                        AI DATA AUDIT ACTIONS
                      </h3>
                      <span className="text-xs font-mono text-[#d9bb8e] bg-[#c5a880]/15 px-3 py-1 rounded-full font-bold">
                        REAL-TIME
                      </span>
                    </div>

                    <div className="space-y-4 pt-4">
                      <button
                        onClick={() => {
                          setActiveTab("copilot");
                          runCopilotQuery("schedule_gaps");
                        }}
                        className="w-full p-5 rounded-2xl bg-[#121820] border border-[#c5a880]/30 hover:border-[#c5a880] text-left space-y-2 transition-all cursor-pointer group shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm sm:text-base font-serif font-bold text-white group-hover:text-[#d9bb8e]">
                            ⚡ Optimize Suite Gaps (2 PM - 4 PM)
                          </span>
                          <span className="text-xs font-mono bg-[#d9bb8e] text-[#07090b] px-2.5 py-0.5 rounded-full font-bold">
                            AI AUDIT
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                          Detect unbooked suite capacity and capture ₹5,400 in idle beds.
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("copilot");
                          runCopilotQuery("vip_churn");
                        }}
                        className="w-full p-5 rounded-2xl bg-[#121820] border border-white/10 hover:border-white/25 text-left space-y-2 transition-all cursor-pointer group shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm sm:text-base font-serif font-bold text-white group-hover:text-[#d9bb8e]">
                            👑 Retain 4 Lapsed Obsidian VIPs
                          </span>
                          <span className="text-xs font-mono text-amber-300 font-bold">
                            ₹1.84L LTV →
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                          Personalized outreach based on medical notes and favorite oils.
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("copilot");
                          runCopilotQuery("inventory_depletion");
                        }}
                        className="w-full p-4 rounded-2xl bg-[#121820] border border-white/10 hover:border-white/25 text-left space-y-1.5 transition-all cursor-pointer group shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-serif font-bold text-white group-hover:text-[#d9bb8e]">
                            🌿 Low Stock Alert: Alpine Eucalyptus (0.4L)
                          </span>
                          <span className="text-xs font-mono text-red-400 font-bold">
                            1.5 Days Left →
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-sans">
                          Reorder threshold reached for weekend therapies.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. DAILY OWNER ACTION PLAN */}
              <div className="pt-2">
                <TodayCard language={language} />
              </div>
            </div>
          )}

          {/* 
            ====================================================================
            TAB 2: AI OPERATIONS COPILOT (DATA INTELLIGENCE SUITE)
            ====================================================================
          */}
          {activeTab === "copilot" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
                <div>
                  <div className="flex items-center gap-2.5 text-xs font-mono text-[#d9bb8e] uppercase tracking-[0.25em] font-bold">
                    <Sparkles className="w-4 h-4 text-[#d9bb8e]" />
                    <span>DATA-DRIVEN OPERATIONS COPILOT</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1.5">
                    Ask your <span className="italic text-[#d9bb8e]">operational data</span> anything.
                  </h2>
                  <p className="text-sm sm:text-base text-neutral-300 mt-2 max-w-3xl leading-relaxed">
                    Directly analyzes today's appointments, customer CRM records, botanical oil stocks, and therapist load metrics in real-time.
                  </p>
                </div>

                <button
                  onClick={() => runCopilotQuery(activePreset, customQuestion)}
                  disabled={copilotBusy}
                  className="px-6 py-3 rounded-full bg-[#c5a880] text-[#07090b] text-sm font-sans font-bold uppercase tracking-wider flex items-center gap-2.5 hover:brightness-110 transition-all cursor-pointer shadow-xl shadow-[#c5a880]/25 self-start sm:self-auto disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${copilotBusy ? "animate-spin" : ""}`} />
                  <span>{copilotBusy ? "Analyzing Data..." : "Run Fresh Data Audit"}</span>
                </button>
              </div>

              {/* Query Preset Chips */}
              <div className="space-y-3.5">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                  CHOOSE AN OPERATIONAL AUDIT LENS:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COPILOT_PRESETS.map((preset) => {
                    const isSelected = activePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => runCopilotQuery(preset.intent)}
                        disabled={copilotBusy}
                        className={`p-5 rounded-3xl border text-left space-y-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#18232e] border-[#c5a880] shadow-xl shadow-[#c5a880]/15 ring-2 ring-[#c5a880]"
                            : "bg-[#0c1015] border-white/10 hover:border-white/25 hover:bg-[#121920]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm sm:text-base font-serif font-bold text-white">{preset.label}</span>
                          {isSelected && <span className="w-3 h-3 rounded-full bg-[#c5a880]" />}
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">{preset.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Query Input with Voice */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#0c1015] border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#d9bb8e] font-bold">
                    OR ASK A CUSTOM OPERATIONAL QUESTION (HINDI, HINGLISH OR ENGLISH):
                  </span>
                  {dictation.supported && (
                    <button
                      onClick={dictation.listening ? dictation.stop : dictation.start}
                      className={`text-xs font-mono font-bold flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer ${
                        dictation.listening
                          ? "bg-red-500/25 text-red-300 border border-red-500/40 animate-pulse"
                          : "bg-white/10 text-neutral-300 hover:text-white"
                      }`}
                    >
                      {dictation.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#c5a880]" />}
                      <span>{dictation.listening ? "Listening..." : "Voice Input"}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3.5">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runCopilotQuery("all_operations", customQuestion)}
                    placeholder="e.g. Kaunse rooms mein 2 baje ke baad gap hai aur kaunsa oil stock low hai?"
                    className="flex-1 bg-[#080c0f] border border-white/20 rounded-2xl px-5 py-4 text-sm sm:text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#c5a880]"
                  />
                  <button
                    onClick={() => runCopilotQuery("all_operations", customQuestion)}
                    disabled={copilotBusy || !customQuestion.trim()}
                    className="px-8 py-4 rounded-2xl bg-[#c5a880] text-[#07090b] text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-40 cursor-pointer shrink-0 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Analyze</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {copilotError && (
                <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm font-mono">
                  ⚠️ {copilotError}
                </div>
              )}

              {/* Loading State */}
              {copilotBusy && (
                <div className="p-16 rounded-3xl bg-[#0b0f13] border border-white/15 flex flex-col items-center justify-center space-y-4 text-center animate-pulse">
                  <RefreshCw className="w-10 h-10 text-[#c5a880] animate-spin" />
                  <div className="space-y-1.5">
                    <p className="text-lg font-serif font-bold text-white">
                      Analyzing live spa dataset...
                    </p>
                    <p className="text-sm text-neutral-400 font-mono">
                      Correlating 8 today's slots, 25 CRM VIP profiles, 6 oil stocks & staff fatigue
                    </p>
                  </div>
                </div>
              )}

              {/* Copilot Structured Results */}
              {!copilotBusy && copilotData && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#15202c] via-[#0f171f] to-[#0a0e13] border border-[#c5a880]/40 shadow-2xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#d9bb8e] font-bold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#d9bb8e]" />
                        <span>OPERATIONAL INTELLIGENCE BRIEF</span>
                      </span>

                      {copilotData.spoken && copilotSpeech.supported && (
                        <button
                          onClick={() =>
                            copilotSpeech.speaking
                              ? copilotSpeech.stop()
                              : copilotSpeech.speak(copilotData.spoken)
                          }
                          className="flex items-center gap-2 text-sm font-mono text-[#d9bb8e] hover:underline cursor-pointer self-start sm:self-auto font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/10"
                        >
                          {copilotSpeech.speaking ? <Square className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                          <span>{copilotSpeech.speaking ? "Stop Audio" : "Listen to Brief"}</span>
                        </button>
                      )}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-serif text-white font-bold leading-snug">
                      {copilotData.headline}
                    </h3>

                    <p className="text-sm sm:text-base text-neutral-200 font-sans leading-relaxed">
                      {copilotData.directAnswer}
                    </p>
                  </div>

                  {/* 4 Data-Driven KPI Summary Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {copilotData.kpiSummary.map((kpi, idx) => (
                      <div
                        key={idx}
                        className={`p-6 rounded-3xl border space-y-2 shadow-lg ${
                          kpi.status === "alert"
                            ? "bg-red-950/25 border-red-500/40"
                            : kpi.status === "warning"
                            ? "bg-amber-950/25 border-amber-500/40"
                            : "bg-[#0c1015] border-white/10"
                        }`}
                      >
                        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest font-bold block">
                          {kpi.label}
                        </span>
                        <div
                          className={`text-2xl sm:text-3xl font-serif font-bold ${
                            kpi.status === "alert"
                              ? "text-red-400"
                              : kpi.status === "warning"
                              ? "text-amber-400"
                              : "text-[#d9bb8e]"
                          }`}
                        >
                          {kpi.value}
                        </div>
                        <span className="text-xs sm:text-sm font-sans text-neutral-300 block leading-tight font-medium">
                          {kpi.subtext}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Operational Anomalies */}
                  {copilotData.anomalies.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono uppercase tracking-widest text-[#d9bb8e] font-bold flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                          <span>OPERATIONAL ANOMALIES & FLAGS DETECTED ({copilotData.anomalies.length})</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {copilotData.anomalies.map((anom, idx) => (
                          <div
                            key={idx}
                            className={`p-6 rounded-3xl border flex items-start justify-between gap-4 shadow-xl ${
                              anom.severity === "high"
                                ? "bg-red-950/25 border-red-500/40"
                                : "bg-amber-950/25 border-amber-500/40"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-base sm:text-lg font-serif font-bold text-white">
                                  {anom.title}
                                </span>
                                <span
                                  className={`text-xs font-mono px-3 py-1 rounded-full uppercase font-bold ${
                                    anom.severity === "high"
                                      ? "bg-red-500/25 text-red-300 border border-red-500/40"
                                      : "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                                  }`}
                                >
                                  {anom.severity} Risk
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
                                {anom.description}
                              </p>
                              <span className="text-xs font-mono text-[#d9bb8e] font-bold block pt-1">
                                Affected: {anom.entity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prioritized 1-Click Action Plan */}
                  {copilotData.actionPlan.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono uppercase tracking-widest text-[#d9bb8e] font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>RECOMMENDED ACTIONS & 1-CLICK RESOLUTIONS:</span>
                        </span>
                      </div>

                      <div className="space-y-4">
                        {copilotData.actionPlan.map((act, idx) => (
                          <div
                            key={act.id || idx}
                            className="p-6 rounded-3xl bg-[#0c1015] border border-white/10 hover:border-[#c5a880]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3.5">
                                <span className="text-xs font-mono font-bold text-[#d9bb8e] bg-[#16202a] px-3 py-1 rounded-lg border border-white/10">
                                  ACTION 0{idx + 1}
                                </span>
                                <h4 className="text-base sm:text-lg font-serif font-bold text-white">
                                  {act.title}
                                </h4>
                                <span
                                  className={`text-xs font-mono px-3 py-0.5 rounded-full uppercase font-bold ${
                                    act.urgency === "immediate"
                                      ? "bg-red-500/25 text-red-300 border border-red-500/40"
                                      : "bg-blue-500/25 text-blue-300 border border-blue-500/40"
                                  }`}
                                >
                                  {act.urgency}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-200 font-sans leading-relaxed">
                                {act.action}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 pt-1">
                                <span>💡 {act.rationale}</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-bold">Impact: {act.impact}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="shrink-0 flex items-center gap-3">
                              {act.actionType === "contact_vip" && (
                                <button
                                  onClick={() => {
                                    const text = `Hi! As a valued guest at Alexa Spa, we have an exclusive personalized reservation window ready for you with your favorite organic oils. Would you like us to reserve your preferred suite this week?`;
                                    window.open(`https://wa.me/919820012345?text=${encodeURIComponent(text)}`, "_blank");
                                  }}
                                  className="px-5 py-3 rounded-2xl bg-[#25D366] text-[#07090b] text-xs sm:text-sm font-mono font-bold flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>WhatsApp VIP</span>
                                </button>
                              )}

                              {act.actionType === "fill_slot" && (
                                <button
                                  onClick={() => setIsAICheckInOpen(true)}
                                  className="px-5 py-3 rounded-2xl bg-[#c5a880] text-[#07090b] text-xs sm:text-sm font-sans font-bold hover:brightness-110 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  <span>Fast Check-In</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 
            ====================================================================
            TAB 3: APPOINTMENTS & THERAPY SUITES (REAL-TIME HIGHLIGHTED SLOTS)
            ====================================================================
          */}
          {activeTab === "appointments" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-white font-bold">
                    Appointments & Live Therapy Suites
                  </h2>
                  <p className="text-sm text-neutral-300 font-mono mt-1">
                    Real-time bookings synced with online website checkout & AI WhatsApp bridge
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSimulateTestBooking()}
                    className="px-4 py-2.5 rounded-full bg-[#182330] hover:bg-[#202f40] text-[#d9bb8e] text-xs font-mono font-bold border border-[#c5a880]/40 flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-[#d9bb8e]" />
                    <span>+ Test Web Booking</span>
                  </button>

                  <button
                    onClick={() => setIsAICheckInOpen(true)}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#c5a880] to-[#e4d3ba] text-[#07090b] text-sm font-bold font-sans uppercase hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-xl shadow-[#c5a880]/20 transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> ⚡ AI FAST CHECK-IN
                  </button>
                </div>
              </div>

              {/* Live Visual Suite Matrix */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1015] border border-white/10 shadow-2xl">
                <VisualSuiteMatrix onFillSuiteWithAI={handleFillSuiteWithAI} />
              </div>

              {/* AI Yield Gap Assistant Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#172330] to-[#101922] border border-[#c5a880]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#c5a880]/20 text-[#c5a880]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-serif font-bold text-white block">
                      AI Schedule Yield: 2 Idle Suite Gaps Detected Today (2:00 PM - 4:00 PM)
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-neutral-300">
                      Potential uncaptured revenue: ₹5,400 in Single En-Suite 01 & 02.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("copilot");
                    runCopilotQuery("schedule_gaps");
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#c5a880] text-[#07090b] text-xs font-mono font-bold uppercase hover:brightness-110 transition-all cursor-pointer shrink-0 shadow-md"
                >
                  AI Gap Resolution →
                </button>
              </div>

              {/* Appointments List with Highlighted Live Bookings */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#d9bb8e] font-bold">
                    CONFIRMED GUEST APPOINTMENTS ({appointments.length}):
                  </span>
                  <span className="text-xs font-mono text-neutral-400">Sorted chronologically (Newest first)</span>
                </div>

                {appointments.map((app) => {
                  const isNewOnline = app.isNewOnlineBooking;
                  return (
                    <div
                      key={app.id}
                      className={`p-6 rounded-3xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl ${
                        isNewOnline
                          ? "bg-gradient-to-r from-[#172535] via-[#121c27] to-[#0c1015] border-2 border-[#c5a880] ring-2 ring-[#c5a880]/50 shadow-[0_0_30px_rgba(197,168,128,0.25)]"
                          : "bg-[#0c1015] border border-white/10 hover:border-[#c5a880]/50"
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3.5 flex-wrap">
                          <span className="text-lg font-serif font-bold text-white">
                            {app.name}
                          </span>
                          <span className="text-xs font-mono text-[#d9bb8e] bg-[#16202a] px-3 py-1 rounded-lg border border-white/10 font-bold">
                            {app.id}
                          </span>

                          {isNewOnline && (
                            <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-[#c5a880] text-[#07090b] shadow-lg animate-pulse">
                              ✨ LIVE NEW ONLINE BOOKING
                            </span>
                          )}

                          <span
                            className={`text-xs font-mono px-3 py-1 rounded-full font-bold ${
                              app.status === "Checked In"
                                ? "bg-blue-500/25 text-blue-300 border border-blue-400/40"
                                : app.status === "Completed"
                                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                                : "bg-[#c5a880]/25 text-[#f7f4ee] border border-[#c5a880]/40"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-neutral-300 font-mono">
                          <span className="text-white font-semibold">📞 +91 {app.phone}</span>
                          <span>•</span>
                          <span className="text-[#d9bb8e] font-semibold">✨ {app.therapy}</span>
                          <span>•</span>
                          <span className="text-white font-bold bg-[#141b22] px-2.5 py-0.5 rounded-md border border-white/10">⏰ {app.time}</span>
                          <span>•</span>
                          <span>🚪 {app.room}</span>
                          <span>•</span>
                          <span>👩‍💼 Therapist: <strong className="text-white">{app.therapist}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">🌿 {app.oil}</span>
                        </div>
                      </div>

                      {/* Status & WhatsApp Actions */}
                      <div className="flex items-center gap-3 flex-wrap shrink-0">
                        <button
                          onClick={() => handleSendReminderWhatsApp(app)}
                          className="px-4 py-2.5 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-xs font-mono font-bold flex items-center gap-2 hover:bg-[#25D366] hover:text-[#07090b] transition-all cursor-pointer"
                          title="Send WhatsApp appointment reminder"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>REMIND</span>
                        </button>

                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                          className="bg-[#141b22] border border-white/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-[#c5a880] cursor-pointer"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Checked In">Checked In</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        <span className="font-mono text-lg sm:text-xl font-bold text-[#d9bb8e] min-w-[85px] text-right">
                          {app.amount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 
            ====================================================================
            TAB 4: STAFF & THERAPIST ROSTER CRM (COMPREHENSIVE SPA HR SUITE)
            ====================================================================
          */}
          {activeTab === "staff" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-white font-bold">
                    Master Therapists & Staff Roster CRM
                  </h2>
                  <p className="text-sm text-neutral-300 font-mono mt-1">
                    Real-time room occupancy, shift attendance, daily commissions (10%) & fatigue balancer
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveTab("copilot");
                      runCopilotQuery("therapist_fatigue");
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#18222c] border border-[#c5a880]/50 hover:border-[#c5a880] text-[#c5a880] text-xs sm:text-sm font-mono font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> AI Fatigue Balancer
                  </button>

                  <button
                    onClick={() => {
                      alert("Opening Staff Registration Modal to add new certified therapist.");
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#c5a880] hover:brightness-110 text-[#07090b] text-xs sm:text-sm font-sans font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl shadow-[#c5a880]/20 transition-all"
                  >
                    <Plus className="w-4 h-4" /> + Add New Staff
                  </button>
                </div>
              </div>

              {/* Staff Filter Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-b border-white/10 pb-4">
                {[
                  { id: "all", label: `All Staff (${staff.length})` },
                  { id: "active", label: `In Session (${staff.filter((s) => s.status.includes("In Session")).length})` },
                  { id: "available", label: `Standby / Ready (${staff.filter((s) => s.status.includes("Available")).length})` },
                  { id: "fatigue", label: `⚠️ Fatigue Action Needed (${staff.filter((s) => s.fatigueIndex.includes("High")).length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStaffFilter(f.id)}
                    className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-mono transition-all cursor-pointer font-bold ${
                      staffFilter === f.id
                        ? "bg-[#c5a880] text-[#07090b] shadow-lg shadow-[#c5a880]/20"
                        : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/15"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Staff Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {staff
                  .filter((s) => {
                    if (staffFilter === "active") return s.status.includes("In Session");
                    if (staffFilter === "available") return s.status.includes("Available");
                    if (staffFilter === "fatigue") return s.fatigueIndex.includes("High");
                    return true;
                  })
                  .map((st) => (
                    <div
                      key={st.id}
                      className="p-6 sm:p-7 rounded-3xl bg-[#0c1015] border border-white/10 space-y-5 hover:border-[#c5a880]/50 transition-all flex flex-col justify-between shadow-xl"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between border-b border-white/10 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                                {st.name}
                              </h3>
                              <span
                                className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold ${
                                  st.status.includes("In Session")
                                    ? "bg-blue-500/25 text-blue-300 border border-blue-400/40"
                                    : "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                                }`}
                              >
                                {st.status}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-[#d9bb8e] font-bold block">{st.role}</span>
                            <span className="text-xs font-mono text-neutral-400 block">{st.phone} • Shift: {st.shift}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-mono text-amber-300 font-bold bg-[#16202a] px-3 py-1 rounded-full border border-white/10 inline-block">
                              {st.rating}
                            </span>
                            <span className="text-xs font-mono text-emerald-400 font-bold block mt-1">
                              {st.attendance}
                            </span>
                          </div>
                        </div>

                        {/* Performance Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-mono">
                          <div className="p-3.5 rounded-2xl bg-[#121820] border border-white/10 space-y-1">
                            <span className="text-xs text-neutral-400 block">TODAY'S SESSIONS:</span>
                            <span className="text-white font-bold text-base">{st.sessionsToday} Completed</span>
                            <span className="text-[11px] text-neutral-400 block font-normal">{st.sessionsMonth} this month</span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-[#121820] border border-white/10 space-y-1">
                            <span className="text-xs text-neutral-400 block">DAILY COMMISSION (10%):</span>
                            <span className="text-[#d9bb8e] font-bold text-base">{st.commissionToday}</span>
                            <span className="text-[11px] text-neutral-400 block font-normal">Gross: {st.grossToday}</span>
                          </div>
                        </div>

                        {/* Fatigue & Specialty */}
                        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs sm:text-sm font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">PHYSICAL STRAIN INDEX:</span>
                            <span className={`font-bold ${st.fatigueIndex.includes("High") ? "text-red-400" : "text-emerald-400"}`}>
                              {st.fatigueIndex}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">RECOVERY BREAK:</span>
                            <span className={`font-bold ${st.breakStatus.includes("Needed") ? "text-amber-300" : "text-neutral-200"}`}>
                              {st.breakStatus}
                            </span>
                          </div>
                          <div className="pt-1 text-xs text-neutral-300 border-t border-white/5 font-sans">
                            <strong>Specialty:</strong> {st.specialty}
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                        {st.fatigueIndex.includes("High") ? (
                          <button
                            onClick={() => handleLogStaffBreak(st.id)}
                            className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Coffee className="w-3.5 h-3.5" /> Log 20m Hydro-Break
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-neutral-400">Tips This Month: <strong className="text-white">{st.tipsMonth}</strong></span>
                        )}

                        <button
                          onClick={() => handleSendStaffPayoutWhatsApp(st)}
                          className="px-4 py-2 rounded-xl bg-[#25D366] text-[#07090b] text-xs font-mono font-bold flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" /> WhatsApp Daily Slip
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 
            ====================================================================
            TAB 5: CUSTOMER CRM & AI UPSELL VAULT
            ====================================================================
          */}
          {activeTab === "customers" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-white font-bold">
                    Customer Retention CRM & AI Upsell Vault
                  </h2>
                  <p className="text-sm text-neutral-300 font-mono mt-1">
                    1-Month guest records, AI-predicted upgrades, and loyalty telemetry
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-4 top-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0c1015] border border-white/20 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              {/* AI VIP Retention Alert */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/30 to-[#121921] border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-serif font-bold text-white block">
                      AI Churn Alert: 4 High-Value VIPs Lapsed &gt;30 Days (Combined LTV: ₹1,84,200)
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-neutral-300">
                      Priya Sundaram, Aarav Mehta, Neha Sharma & Aditi Rao require personalized reactivation.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("copilot");
                    runCopilotQuery("vip_churn");
                  }}
                  className="px-5 py-2.5 rounded-full bg-amber-400 text-[#07090b] text-xs font-mono font-bold uppercase hover:brightness-110 transition-all cursor-pointer shrink-0 shadow-md"
                >
                  AI Retention Plan →
                </button>
              </div>

              {/* Segment Filter Pills */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-b border-white/10 pb-4">
                {[
                  { id: "all", label: `All Guests (${customers.length})` },
                  { id: "obsidian", label: `👑 Black Obsidian (${customers.filter((c) => c.segment === "obsidian").length})` },
                  { id: "gold", label: `✨ Gold VIP (${customers.filter((c) => c.segment === "gold").length})` },
                  { id: "lapsed", label: `⚠️ Lapsed 30+ Days (${customers.filter((c) => c.segment === "lapsed").length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCrmSegment(tab.id)}
                    className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-mono transition-all cursor-pointer font-bold ${
                      crmSegment === tab.id
                        ? "bg-[#c5a880] text-[#07090b] shadow-lg shadow-[#c5a880]/20"
                        : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/15"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Customer Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customers
                  .filter((c) => {
                    const matchesSegment = crmSegment === "all" || c.segment === crmSegment;
                    const matchesSearch =
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.phone.includes(searchQuery) ||
                      c.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.preferredOil.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesSegment && matchesSearch;
                  })
                  .map((cust) => {
                    const aiUpsellSuggestion =
                      cust.segment === "obsidian"
                        ? "90-Min Volcanic Knot Upgrade (+₹600) — High Stress Profile"
                        : cust.segment === "gold"
                        ? "Add-on 24K Gold Collagen Eye Recovery (+₹700)"
                        : "Re-engagement 25% Comeback Pass (Code: WELCOMEBACK25)";

                    return (
                      <div
                        key={cust.id}
                        className="p-6 sm:p-7 rounded-3xl bg-[#0c1015] border border-white/10 space-y-5 hover:border-[#c5a880]/50 transition-all flex flex-col justify-between shadow-xl"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between border-b border-white/10 pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                                  {cust.name}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                                    cust.segment === "obsidian"
                                      ? "bg-[#c5a880]/25 text-[#f7f4ee] border border-[#c5a880]/50"
                                      : cust.segment === "gold"
                                      ? "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                                      : "bg-red-500/25 text-red-300 border border-red-500/40"
                                  }`}
                                >
                                  {cust.tier}
                                </span>
                              </div>
                              <span className="text-sm font-mono text-neutral-400 font-semibold">{cust.phone}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-xl sm:text-2xl font-mono text-[#d9bb8e] font-bold block">{cust.totalSpent}</span>
                              <span className="text-xs font-mono text-neutral-400">{cust.visits} Total Visits</span>
                            </div>
                          </div>

                          {/* Health & Preferences */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-mono">
                              <div className="p-3 rounded-2xl bg-[#121820] border border-white/10 text-white">
                                <span className="text-neutral-400 block text-xs">PRESSURE:</span>
                                <span className="font-bold">{cust.pressure}</span>
                              </div>
                              <div className="p-3 rounded-2xl bg-[#121820] border border-white/10 text-white">
                                <span className="text-neutral-400 block text-xs">FAVORITE OIL:</span>
                                <span className="font-bold">{cust.preferredOil}</span>
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm text-neutral-200 font-sans p-3.5 rounded-2xl bg-black/60 border border-white/10 leading-relaxed">
                              📝 <span className="italic">{cust.notes}</span>
                            </p>

                            {/* AI Predictive Upsell Badge */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#172330] to-[#121c27] border border-[#c5a880]/40 space-y-1">
                              <div className="flex items-center gap-2 text-xs font-mono text-[#d9bb8e] uppercase tracking-wider font-bold">
                                <Sparkles className="w-4 h-4 text-[#d9bb8e]" />
                                <span>AI PREDICTIVE UPSELL ENGINE</span>
                              </div>
                              <span className="text-xs sm:text-sm font-sans text-white font-bold block">
                                {aiUpsellSuggestion}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs sm:text-sm">
                          <span className="text-xs font-mono text-neutral-400 font-medium">Last Visit: {cust.lastVisit}</span>
                          <button
                            onClick={() => {
                              const text = `Hi ${cust.name}! As a valued *${cust.tier}* at Alexa Spa, we prepared your favorite *${cust.preferredOil}* oil and have an exclusive upgrade ready: *${aiUpsellSuggestion}*. Would you like us to reserve your preferred slot this week?`;
                              window.open(`https://wa.me/${cust.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
                            }}
                            className="px-4 py-2 rounded-xl bg-[#25D366] text-[#07090b] font-mono text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <MessageCircle className="w-4 h-4" /> Send WhatsApp Offer →
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 
            ====================================================================
            TAB 6: INVENTORY & STOCK TRACKER
            ====================================================================
          */}
          {activeTab === "inventory" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-white font-bold">
                    Botanical Oils & Apothecary Inventory
                  </h2>
                  <p className="text-sm text-neutral-300 font-mono mt-1">
                    Real-time stock depletion velocity correlated with active appointments
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab("copilot");
                    runCopilotQuery("inventory_depletion");
                  }}
                  className="px-6 py-3 rounded-full bg-[#c5a880] text-[#07090b] text-xs sm:text-sm font-mono font-bold uppercase hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-4 h-4" /> AI Stock Forecast
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map((item) => (
                  <div key={item.id} className="p-6 sm:p-7 rounded-3xl bg-[#0c1015] border border-white/10 space-y-4 hover:border-[#c5a880]/50 transition-all shadow-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-sm sm:text-base font-serif text-white font-bold">{item.name}</span>
                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-full font-bold ${
                          item.status === "LOW STOCK"
                            ? "bg-red-500/25 text-red-300 border border-red-500/40"
                            : "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-mono text-[#d9bb8e] font-bold">{item.stock}</div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-mono text-neutral-300 border-t border-white/10 pt-3">
                      <div>
                        <span className="text-neutral-400 block text-xs">Burn Rate:</span>
                        <span className="font-bold text-white">{item.burnRate}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-xs">Supply Left:</span>
                        <span className={`font-bold ${item.status === "LOW STOCK" ? "text-red-400" : "text-emerald-400"}`}>
                          {item.daysLeft}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-neutral-400 pt-1">
                      Re-order threshold: <strong className="text-white">{item.reorder}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI Fast Walk-In Check-In Modal */}
      <AIFastCheckInModal
        isOpen={isAICheckInOpen}
        onClose={() => setIsAICheckInOpen(false)}
        onAddAppointment={handleAddNewAppointment}
      />
    </div>
  );
}
