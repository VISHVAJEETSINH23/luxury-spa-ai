"use client";

import { useState } from "react";
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
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Plus,
  Search,
  Filter,
  Bot,
  Send,
  Download,
  Phone,
  Settings,
  Square,
  Volume2,
} from "lucide-react";

import TodayCard from "@/components/admin/TodayCard";
import { LANGUAGE_LABELS, useOwnerLanguage, useSpeech } from "@/components/admin/OwnerVoice";

// Mock Active Today Appointments
const INITIAL_APPOINTMENTS = [
  {
    id: "ALX-918231",
    name: "Vikram Malhotra",
    phone: "98201 44552",
    therapy: "Deep Tissue Muscle Relief (60m)",
    time: "11:30 AM",
    room: "Single En-Suite 01",
    therapist: "Pooja Sharma",
    amount: "₹2,499",
    status: "Checked In",
    oil: "Alpine Eucalyptus",
  },
  {
    id: "ALX-827361",
    name: "Ananya & Rohan Kapoor",
    phone: "99302 11883",
    therapy: "Royal Couple Rejuvenation Suite (90m)",
    time: "01:00 PM",
    room: "VIP Couple Suite",
    therapist: "Maya Devi & Deepak R.",
    amount: "₹4,999",
    status: "Confirmed",
    oil: "French Lavender & Rose",
  },
  {
    id: "ALX-762910",
    name: "Dr. Siddharth Verma",
    phone: "98199 00213",
    therapy: "Heated Volcanic Basalt Spine (75m)",
    time: "02:30 PM",
    room: "Single En-Suite 02",
    therapist: "Pooja Sharma",
    amount: "₹2,999",
    status: "Confirmed",
    oil: "Warm Juniper",
  },
  {
    id: "ALX-661902",
    name: "Meera Sen",
    phone: "97690 33412",
    therapy: "24K Gold Cellular Renewal Facial (60m)",
    time: "04:00 PM",
    room: "Facial Suite 03",
    therapist: "Sunita K.",
    amount: "₹2,999",
    status: "Confirmed",
    oil: "White Rose Nectar",
  },
  {
    id: "ALX-551029",
    name: "Karan Johar (Corporate)",
    phone: "98210 99881",
    therapy: "Signature Balinese Aromatherapy (90m)",
    time: "06:00 PM",
    room: "Single En-Suite 01",
    therapist: "Maya Devi",
    amount: "₹3,499",
    status: "Pending",
    oil: "Sweet Ylang Ylang",
  },
];

// Mock Customer CRM
const INITIAL_CUSTOMERS = [
  {
    id: "CUST-01",
    name: "Vikram Malhotra",
    phone: "+91 98201 44552",
    visits: 8,
    totalSpent: "₹21,400",
    tier: "Gold VIP",
    preferredOil: "Alpine Eucalyptus",
    pressure: "Deep Pressure",
    notes: "Suffers from chronic lumbar tightness. Prefers 55°C extra hot stones.",
    lastVisit: "Today",
  },
  {
    id: "CUST-02",
    name: "Ananya Kapoor",
    phone: "+91 99302 11883",
    visits: 5,
    totalSpent: "₹18,500",
    tier: "Gold VIP",
    preferredOil: "French Lavender",
    pressure: "Medium Relaxing",
    notes: "Anniversary visit with spouse. Sensitive to synthetic fragrances.",
    lastVisit: "Today",
  },
  {
    id: "CUST-03",
    name: "Ramesh Aggarwal",
    phone: "+91 98200 99112",
    visits: 12,
    totalSpent: "₹34,000",
    tier: "Black Obsidian",
    preferredOil: "Thai Lemongrass",
    pressure: "Deep Athletic",
    notes: "Regular every Saturday morning. Needs quiet room, zero conversation.",
    lastVisit: "3 days ago",
  },
  {
    id: "CUST-04",
    name: "Priya Sundaram",
    phone: "+91 98701 22334",
    visits: 2,
    totalSpent: "₹4,800",
    tier: "Silver Member",
    preferredOil: "Cold-Pressed Jojoba",
    pressure: "Gentle",
    notes: "First facial trial last month. Interested in weekday happy hours.",
    lastVisit: "35 days ago (Inactive)",
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
    desc: "Thirty days or more since their last visit",
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
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------------- AI Studio state ----------------
     The old version of this panel shipped three hardcoded WhatsApp messages
     behind a fake "generating" delay. These call Claude for real, through
     server routes in app/api/ai/* so the key stays out of the browser. */
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

  return (
    <div className="min-h-screen bg-[#07090b] text-[#f7f4ee] flex flex-col font-sans select-none">
      {/* Top Admin Header */}
      <header className="bg-[#0b0f12] border-b border-white/10 px-6 sm:px-10 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-[#e8ded2]/60 hover:text-[#c5a880] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">VIEW PUBLIC WEBSITE</span>
          </Link>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm sm:text-base font-serif tracking-widest text-[#f7f4ee] font-bold">
              ALEXA SPA BUSINESS OS
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#c5a880]/20 text-[#c5a880] text-[9px] font-mono">
              BRANCH: GRAND PLAZA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#e8ded2]/70">
          {/* One switch for every word the AI writes for the owner. */}
          <div className="flex items-center rounded-full border border-white/10 p-0.5">
            {LANGUAGE_LABELS.map((option) => (
              <button
                key={option.id}
                onClick={() => setLanguage(option.id)}
                title={option.hint}
                className={`rounded-full px-3 py-1 text-[10px] transition-colors ${
                  language === option.id
                    ? "bg-[#c5a880] font-bold text-[#07090b]"
                    : "text-[#e8ded2]/60 hover:text-[#f7f4ee]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="hidden lg:inline">TODAY: 24 AUG 2026</span>
          <div className="w-8 h-8 rounded-full bg-[#c5a880] text-[#07090b] font-bold flex items-center justify-center">
            AS
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-[#090d10] border-r border-white/10 p-4 sm:p-6 space-y-2">
          {[
            { id: "dashboard", label: "Revenue & KPI Cockpit", icon: BarChart3 },
            { id: "appointments", label: "Appointments & Slots", icon: Calendar, badge: "5 Today" },
            { id: "customers", label: "Customer CRM & History", icon: Users },
            { id: "marketing", label: "AI Marketing Studio", icon: Bot, badge: "AI" },
            { id: "inventory", label: "Oils & Stock Tracker", icon: Package },
            { id: "therapists", label: "Therapist Performance", icon: Award },
          ].map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#c5a880] text-[#07090b] font-bold shadow-md shadow-[#c5a880]/20"
                    : "text-[#e8ded2]/70 hover:bg-white/5 hover:text-[#f7f4ee]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{nav.label}</span>
                </div>
                {nav.badge && (
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? "bg-[#07090b] text-[#c5a880]" : "bg-white/10 text-[#c5a880]"
                    }`}
                  >
                    {nav.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Dynamic Content Panel */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
          {/* 
            ====================================================================
            TAB 1: REVENUE & KPI DASHBOARD
            ====================================================================
          */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-serif text-[#f7f4ee] tracking-wide">
                  Executive Revenue & Business Pulse
                </h2>
                <p className="text-xs text-[#e8ded2]/60 font-mono">
                  Live metrics for Alexa Spa (Grand Plaza Center)
                </p>
              </div>

              {/* The first thing on the screen: what to actually do today. */}
              <TodayCard language={language} />

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#0e1318] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#e8ded2]/60 font-mono">
                    <span>TODAY'S REVENUE</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#c5a880]">
                    ₹48,980
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 block">
                    +18.4% vs yesterday (18 Bookings)
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e1318] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#e8ded2]/60 font-mono">
                    <span>BED OCCUPANCY</span>
                    <Clock className="w-4 h-4 text-[#c5a880]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#f7f4ee]">
                    84.2%
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 block">
                    4 Afternoon Slots Filled via Happy Hour
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e1318] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#e8ded2]/60 font-mono">
                    <span>AVG TICKET SIZE (AOV)</span>
                    <DollarSign className="w-4 h-4 text-[#c5a880]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#f7f4ee]">
                    ₹2,720
                  </div>
                  <span className="text-[10px] font-mono text-[#c5a880] block">
                    AI Upsell conversion: 32%
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e1318] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#e8ded2]/60 font-mono">
                    <span>CUSTOMER RETENTION</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#f7f4ee]">
                    68.5%
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 block">
                    Repeat guests within 30 days
                  </span>
                </div>
              </div>

              {/* High Grossing Therapies Leaderboard & Fast Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0e1318] border border-white/10 space-y-4">
                  <h3 className="text-sm font-mono tracking-wider text-[#c5a880] uppercase">
                    TOP GROSSING THERAPIES THIS MONTH
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: "Deep Tissue Muscle Relief (60/90m)", revenue: "₹4,12,000", bookings: 142, share: "34%" },
                      { name: "Royal Couple Rejuvenation Suite (90m)", revenue: "₹3,49,930", bookings: 70, share: "28%" },
                      { name: "Signature Balinese Aromatherapy (75m)", revenue: "₹2,59,900", bookings: 100, share: "21%" },
                      { name: "24K Gold Cellular Facial (60m)", revenue: "₹1,49,950", bookings: 50, share: "12%" },
                    ].map((item, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-[#141b22] flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <span className="font-serif text-[#f7f4ee] font-medium block">{item.name}</span>
                          <span className="text-[10px] font-mono text-[#e8ded2]/50">{item.bookings} appointments completed</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[#c5a880] font-bold block">{item.revenue}</span>
                          <span className="text-[10px] font-mono text-emerald-400">{item.share} of total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0e1318] border border-white/10 space-y-5">
                  <h3 className="text-sm font-mono tracking-wider text-[#c5a880] uppercase">
                    QUICK REVENUE ACTIONS
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("marketing")}
                      className="w-full p-4 rounded-xl bg-[#141b22] border border-[#c5a880]/30 hover:border-[#c5a880] text-left space-y-1 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-bold text-[#f7f4ee]">⚡ Send Happy Hour WhatsApp Flash</span>
                        <span className="text-[9px] font-mono bg-[#c5a880] text-[#07090b] px-2 py-0.5 rounded-full font-bold">1-CLICK</span>
                      </div>
                      <p className="text-[10px] text-[#e8ded2]/60">Fill 4 idle beds between 1 PM - 4 PM @ ₹1,799.</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("appointments")}
                      className="w-full p-4 rounded-xl bg-[#141b22] border border-white/10 hover:border-white/20 text-left space-y-1 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-bold text-[#f7f4ee]">📅 Manage Today's Appointments</span>
                        <span className="text-xs text-[#c5a880]">5 Booked →</span>
                      </div>
                      <p className="text-[10px] text-[#e8ded2]/60">Check-in guests and send WhatsApp reminders.</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 
            ====================================================================
            TAB 2: APPOINTMENTS & REAL-TIME SLOTS
            ====================================================================
          */}
          {activeTab === "appointments" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-[#f7f4ee]">
                    Today's Appointment Schedule
                  </h2>
                  <p className="text-xs text-[#e8ded2]/60 font-mono">
                    Real-time bookings synced from website & WhatsApp
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => alert("Manual Walk-in added to register!")}
                    className="px-4 py-2 rounded-full bg-[#c5a880] text-[#07090b] text-xs font-bold font-sans uppercase hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> ADD WALK-IN
                  </button>
                </div>
              </div>

              {/* Appointments List */}
              <div className="space-y-3">
                {appointments.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-[#0e1318] border border-white/10 hover:border-[#c5a880]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-serif font-bold text-[#f7f4ee]">
                          {app.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#c5a880] bg-[#141b22] px-2 py-0.5 rounded-md">
                          {app.id}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full ${
                            app.status === "Checked In"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : app.status === "Completed"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-[#c5a880]/20 text-[#c5a880] border border-[#c5a880]/30"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#e8ded2]/70 font-mono">
                        <span>📞 +91 {app.phone}</span>
                        <span>•</span>
                        <span>✨ {app.therapy}</span>
                        <span>•</span>
                        <span className="text-[#c5a880]">⏰ {app.time}</span>
                        <span>•</span>
                        <span>🚪 {app.room}</span>
                        <span>•</span>
                        <span>👩‍💼 Therapist: {app.therapist}</span>
                      </div>
                    </div>

                    {/* Status & WhatsApp Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleSendReminderWhatsApp(app)}
                        className="px-3.5 py-2 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] text-xs font-mono flex items-center gap-1.5 hover:bg-[#25D366] hover:text-[#07090b] transition-all cursor-pointer"
                        title="Send WhatsApp appointment reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>REMIND</span>
                      </button>

                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        className="bg-[#141b22] border border-white/15 rounded-xl px-3 py-2 text-xs text-[#f7f4ee] font-mono focus:outline-none focus:border-[#c5a880]"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Checked In">Checked In</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <span className="font-mono text-sm font-bold text-[#c5a880] min-w-[70px] text-right">
                        {app.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 
            ====================================================================
            TAB 3: CUSTOMER CRM & HEALTH VAULT
            ====================================================================
          */}
          {activeTab === "customers" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-[#f7f4ee]">
                    Customer Retention CRM & Health Vault
                  </h2>
                  <p className="text-xs text-[#e8ded2]/60 font-mono">
                    Guest preferences, lifetime spend, and custom therapy notes
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#e8ded2]/40" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#10151a] border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-[#f7f4ee] focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              {/* Customer Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customers
                  .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))
                  .map((cust) => (
                    <div
                      key={cust.id}
                      className="p-5 rounded-2xl bg-[#0e1318] border border-white/10 space-y-4 hover:border-[#c5a880]/30 transition-all"
                    >
                      <div className="flex items-start justify-between border-b border-white/10 pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-serif font-bold text-[#f7f4ee]">
                              {cust.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-[#c5a880]/20 text-[#c5a880] text-[9px] font-mono">
                              {cust.tier}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[#e8ded2]/60">{cust.phone}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono text-[#c5a880] font-bold block">{cust.totalSpent}</span>
                          <span className="text-[10px] font-mono text-[#e8ded2]/40">{cust.visits} Visits</span>
                        </div>
                      </div>

                      {/* Health & Preferences */}
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="p-2 rounded-lg bg-[#141b22] text-[#e4d3ba]">
                            <span className="text-[#e8ded2]/40 block text-[9px]">PRESSURE:</span>
                            {cust.pressure}
                          </div>
                          <div className="p-2 rounded-lg bg-[#141b22] text-[#e4d3ba]">
                            <span className="text-[#e8ded2]/40 block text-[9px]">FAVORITE OIL:</span>
                            {cust.preferredOil}
                          </div>
                        </div>

                        <p className="text-[11px] text-[#e8ded2]/70 font-sans p-2 rounded-lg bg-[#07090b] border border-white/5">
                          📝 <span className="italic">{cust.notes}</span>
                        </p>
                      </div>

                      {/* Action */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[10px] font-mono text-[#e8ded2]/40">Last Visit: {cust.lastVisit}</span>
                        <button
                          onClick={() => {
                            const text = `Hi ${cust.name}! It's been a while since your last relaxation session at Alexa Spa. We have a special VIP 20% privilege code for your next visit: *VIP20*. Would you like to book a slot this weekend?`;
                            window.open(`https://wa.me/${cust.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
                          }}
                          className="text-[11px] font-mono text-[#25D366] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Direct WhatsApp Chat →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 
            ====================================================================
            TAB 4: AI MARKETING & BROADCAST STUDIO
            ====================================================================
          */}
          {activeTab === "marketing" && (
            <div className="animate-fadeIn space-y-14">
              <header className="space-y-2.5">
                <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[#c5a880]">
                  AI Studio
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#f7f4ee] leading-tight">
                  Write the message, read the <span className="italic text-[#c5a880]">numbers</span>.
                </h2>
                <p className="max-w-[62ch] font-sans text-sm leading-relaxed text-[#e8ded2]/65">
                  Everything here is written against your real price list and your real bookings —
                  it cannot quote a treatment you do not offer or a price you do not charge.
                </p>
              </header>

              {/* ================= BROADCAST ================= */}
              <section className="space-y-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/[0.09] pb-4">
                  <h3 className="font-serif text-xl text-[#f7f4ee]">WhatsApp broadcast</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#e8ded2]/40">
                    For guests who have already visited
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {CAMPAIGN_PRESETS.map((preset) => {
                    const isActive = campaignPrompt === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => runCampaign(preset)}
                        disabled={campaignBusy}
                        className={`group relative pb-2 text-left transition-colors disabled:cursor-wait cursor-pointer ${
                          isActive ? "text-[#c5a880]" : "text-[#e8ded2]/60 hover:text-[#f7f4ee]"
                        }`}
                      >
                        <span className="block font-sans text-sm">{preset.title}</span>
                        <span className="mt-0.5 block font-sans text-[11px] text-[#e8ded2]/40">
                          {preset.desc}
                        </span>
                        <span
                          className={`absolute bottom-0 left-0 right-0 h-px origin-left bg-[#c5a880] transition-transform duration-500 ease-out ${
                            isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-hover:opacity-40"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex-1">
                    <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                      Or describe your own
                    </span>
                    <input
                      value={campaignBrief}
                      onChange={(event) => setCampaignBrief(event.target.value)}
                      placeholder="Diwali offer for couples, fill Sunday evenings"
                      className="w-full border-b border-white/[0.14] bg-transparent py-3 text-base text-[#f7f4ee] placeholder:text-[#e8ded2]/25 transition-colors focus:border-[#c5a880] focus:outline-none"
                    />
                  </label>
                  <button
                    onClick={() =>
                      runCampaign({
                        id: "custom",
                        title: "Custom",
                        desc: "",
                        occasion: campaignBrief,
                        goal: "book more slots",
                      })
                    }
                    disabled={campaignBusy || !campaignBrief.trim()}
                    className="shrink-0 rounded-full bg-[#c5a880] px-8 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#07090b] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    {campaignBusy ? "Writing…" : "Write it"}
                  </button>
                </div>

                {campaignError && (
                  <p className="border-l border-[#e0785e]/60 pl-4 font-sans text-sm text-[#e0785e]">
                    {campaignError}
                  </p>
                )}

                {generatedCampaign && (
                  <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
                    {/* Shown as a phone bubble: copy that reads fine in a text box
                        can still look wrong in the place it will actually land. */}
                    <div>
                      <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                        How it lands
                      </span>
                      <div className="max-w-md rounded-2xl rounded-tl-sm bg-[#075E54]/25 border border-[#25D366]/25 p-5">
                        <textarea
                          rows={9}
                          value={generatedCampaign}
                          onChange={(event) => setGeneratedCampaign(event.target.value)}
                          className="w-full resize-none bg-transparent font-sans text-sm leading-relaxed text-[#f7f4ee] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-5">
                      {campaignMeta?.promoCode && (
                        <div>
                          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                            Promo code
                          </span>
                          <span className="mt-1 block font-mono text-xl text-[#c5a880]">
                            {campaignMeta.promoCode}
                          </span>
                        </div>
                      )}

                      {campaignMeta?.bestTimeToSend && (
                        <div>
                          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                            Send it
                          </span>
                          <span className="mt-1 block font-sans text-sm leading-relaxed text-[#e8ded2]/75">
                            {campaignMeta.bestTimeToSend}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCampaign);
                          setCampaignCopied(true);
                          setTimeout(() => setCampaignCopied(false), 2000);
                        }}
                        className="flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[#07090b] transition-all hover:brightness-110 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {campaignCopied ? "Copied" : "Copy for WhatsApp"}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* ================= REVIEW REPLY ================= */}
              <section className="space-y-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/[0.09] pb-4">
                  <h3 className="font-serif text-xl text-[#f7f4ee]">Google review reply</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#e8ded2]/40">
                    Draft, edit, post
                  </span>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                        The review
                      </span>
                      <textarea
                        rows={6}
                        value={reviewText}
                        onChange={(event) => setReviewText(event.target.value)}
                        placeholder="Paste it here…"
                        className="w-full resize-none border-b border-white/[0.14] bg-transparent py-3 font-sans text-base leading-relaxed text-[#f7f4ee] placeholder:text-[#e8ded2]/25 transition-colors focus:border-[#c5a880] focus:outline-none"
                      />
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                          Stars
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              aria-label={`${star} star${star > 1 ? "s" : ""}`}
                              className="cursor-pointer p-0.5 transition-transform hover:scale-110"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  star <= reviewRating
                                    ? "fill-[#c5a880] text-[#c5a880]"
                                    : "text-[#e8ded2]/25"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={runReviewReply}
                        disabled={reviewBusy || !reviewText.trim()}
                        className="rounded-full bg-[#c5a880] px-8 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#07090b] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        {reviewBusy ? "Drafting…" : "Draft reply"}
                      </button>
                    </div>

                    {reviewError && (
                      <p className="border-l border-[#e0785e]/60 pl-4 font-sans text-sm text-[#e0785e]">
                        {reviewError}
                      </p>
                    )}
                  </div>

                  {reviewReply && (
                    <div className="space-y-5">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                        Your reply
                      </span>
                      <textarea
                        rows={6}
                        value={reviewReply}
                        onChange={(event) => setReviewReply(event.target.value)}
                        className="w-full resize-none border-l border-[#c5a880]/50 bg-transparent py-1 pl-5 font-serif text-base leading-relaxed text-[#f7f4ee] focus:outline-none"
                      />

                      {reviewIssues.length > 0 && (
                        <div className="border-t border-white/[0.09] pt-4">
                          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#c5a880]">
                            Check this internally
                          </span>
                          <ul className="mt-2 space-y-1.5 font-sans text-sm text-[#e8ded2]/70">
                            {reviewIssues.map((issue) => (
                              <li key={issue}>· {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={() => navigator.clipboard.writeText(reviewReply)}
                        className="rounded-full border border-white/[0.14] px-7 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#e8ded2]/65 transition-all hover:border-[#c5a880]/60 hover:text-[#c5a880] cursor-pointer"
                      >
                        Copy reply
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* ================= ANALYSIS ================= */}
              <section className="space-y-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/[0.09] pb-4">
                  <h3 className="font-serif text-xl text-[#f7f4ee]">What your bookings say</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#e8ded2]/40">
                    Last 120 days
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex-1">
                    <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                      Ask something specific, or leave it blank
                    </span>
                    <input
                      value={insightsQuestion}
                      onChange={(event) => setInsightsQuestion(event.target.value)}
                      placeholder="Why isn't the couple suite selling?"
                      className="w-full border-b border-white/[0.14] bg-transparent py-3 text-base text-[#f7f4ee] placeholder:text-[#e8ded2]/25 transition-colors focus:border-[#c5a880] focus:outline-none"
                    />
                  </label>
                  <button
                    onClick={runInsights}
                    disabled={insightsBusy}
                    className="shrink-0 rounded-full bg-[#c5a880] px-8 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#07090b] transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-50 cursor-pointer"
                  >
                    {insightsBusy ? "Reading…" : "Analyse"}
                  </button>
                </div>

                {insightsError && (
                  <p className="border-l border-[#e0785e]/60 pl-4 font-sans text-sm leading-relaxed text-[#e0785e]">
                    {insightsError}
                  </p>
                )}

                {insights && (
                  <div className="space-y-10 pt-2">
                    <p className="max-w-[46ch] font-serif text-2xl sm:text-3xl font-light leading-snug text-[#f7f4ee]">
                      {insights.headline}
                    </p>

                    {insights.spoken && insightsSpeech.supported && (
                      <button
                        onClick={() =>
                          insightsSpeech.speaking
                            ? insightsSpeech.stop()
                            : insightsSpeech.speak(insights.spoken as string)
                        }
                        className="flex items-center gap-2 text-xs text-[#c5a880] transition-opacity hover:opacity-70"
                      >
                        {insightsSpeech.speaking ? (
                          <Square className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                        {insightsSpeech.speaking
                          ? language === "en"
                            ? "Stop"
                            : "Roko"
                          : language === "en"
                            ? "Listen to this"
                            : language === "hi"
                              ? "यह सुनिए"
                              : "Ye suno"}
                      </button>
                    )}

                    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 border-t border-white/[0.09] pt-8">
                      {insights.metrics.map((metric) => (
                        <div key={metric.label} className="space-y-1.5">
                          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#e8ded2]/45">
                            {metric.label}
                          </dt>
                          <dd className="font-mono text-2xl tabular-nums text-[#c5a880]">
                            {metric.value}
                          </dd>
                          <dd className="font-sans text-[12px] leading-snug text-[#e8ded2]/55">
                            {metric.note}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="grid gap-12 lg:grid-cols-2">
                      <div className="space-y-4">
                        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#c5a880]">
                          What the data shows
                        </span>
                        <ul className="space-y-3">
                          {insights.findings.map((finding) => (
                            <li
                              key={finding}
                              className="border-b border-white/[0.06] pb-3 font-sans text-sm leading-relaxed text-[#e8ded2]/80"
                            >
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#c5a880]">
                          Do this next
                        </span>
                        <ol className="space-y-5">
                          {insights.actions.map((item, index) => (
                            <li
                              key={item.action}
                              className="grid grid-cols-[28px_1fr] gap-4 border-b border-white/[0.06] pb-5"
                            >
                              <span className="font-mono text-[11px] text-[#c5a880]">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <div className="space-y-1.5">
                                <span className="block font-serif text-base text-[#f7f4ee]">
                                  {item.action}
                                </span>
                                <span className="block font-sans text-[13px] leading-relaxed text-[#e8ded2]/60">
                                  {item.why}
                                </span>
                                <span className="flex gap-2 pt-1">
                                  <span className="rounded-full border border-white/[0.12] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e8ded2]/55">
                                    {item.effort} effort
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${
                                      item.impact === "high"
                                        ? "bg-[#c5a880] text-[#07090b]"
                                        : "border border-white/[0.12] text-[#e8ded2]/55"
                                    }`}
                                  >
                                    {item.impact} impact
                                  </span>
                                </span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {insights.risks.length > 0 && (
                      <div className="space-y-3 border-t border-white/[0.09] pt-6">
                        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/45">
                          Where this could be wrong
                        </span>
                        <ul className="space-y-2 font-sans text-[13px] leading-relaxed text-[#e8ded2]/60">
                          {insights.risks.map((risk) => (
                            <li key={risk}>· {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#e8ded2]/35">
                      {insights.sampleSize} booking requests · no guest names or numbers leave your
                      database
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
          {/* 
            ====================================================================
            TAB 5: INVENTORY & STOCK TRACKER
            ====================================================================
          */}
          {activeTab === "inventory" && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-serif text-[#f7f4ee]">
                Botanical Oils & Consumables Inventory
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "French Lavender Essential Oil", stock: "1.4 Liters", status: "Healthy", reorder: "1.0L" },
                  { name: "Alpine Eucalyptus & Camphor", stock: "0.4 Liters", status: "LOW STOCK", reorder: "0.5L" },
                  { name: "Virgin Cold-Pressed Jojoba Oil", stock: "3.2 Liters", status: "Healthy", reorder: "1.5L" },
                  { name: "Disposable Linen & Innerwear Kits", stock: "82 Sets", status: "Healthy", reorder: "30 Sets" },
                  { name: "Sterilized Soft Towels", stock: "45 Units", status: "Healthy", reorder: "20 Units" },
                  { name: "Herbal Himalayan Tea Pouches", stock: "12 Boxes", status: "Healthy", reorder: "5 Boxes" },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#0e1318] border border-white/10 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-serif text-[#f7f4ee] font-medium">{item.name}</span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          item.status === "LOW STOCK"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xl font-mono text-[#c5a880] font-bold">{item.stock}</div>
                    <span className="text-[10px] font-mono text-[#e8ded2]/40 block">Re-order threshold: {item.reorder}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 
            ====================================================================
            TAB 6: THERAPIST PERFORMANCE & COMMISSIONS
            ====================================================================
          */}
          {activeTab === "therapists" && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-serif text-[#f7f4ee]">
                Therapist Roster & Daily Commission Tracking
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "Pooja Sharma", sessions: 6, gross: "₹14,800", commission: "₹1,480 (10%)", rating: "4.95 ★", specialty: "Deep Tissue & Hot Stone" },
                  { name: "Maya Devi", sessions: 5, gross: "₹12,490", commission: "₹1,249 (10%)", rating: "4.90 ★", specialty: "Balinese Aromatherapy & Thai" },
                  { name: "Deepak Rawat", sessions: 4, gross: "₹9,800", commission: "₹980 (10%)", rating: "4.85 ★", specialty: "Swedish & Foot Reflexology" },
                ].map((th, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#0e1318] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h3 className="text-base font-serif font-bold text-[#f7f4ee]">{th.name}</h3>
                        <span className="text-[10px] font-mono text-[#c5a880]">{th.specialty}</span>
                      </div>
                      <span className="text-xs font-mono text-amber-300 font-bold bg-[#141b22] px-2.5 py-1 rounded-full">
                        {th.rating}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-[#e8ded2]/60">
                        <span>Sessions Today:</span>
                        <span className="text-[#f7f4ee]">{th.sessions} Appointments</span>
                      </div>
                      <div className="flex justify-between text-[#e8ded2]/60">
                        <span>Gross Revenue:</span>
                        <span className="text-[#f7f4ee]">{th.gross}</span>
                      </div>
                      <div className="flex justify-between text-[#c5a880] font-bold border-t border-white/5 pt-1.5">
                        <span>Daily Commission:</span>
                        <span>{th.commission}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
