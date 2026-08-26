"use client";

import { useState } from "react";
import { Sparkles, X, Check, Wand2 } from "lucide-react";

interface Appointment {
  id: string;
  name: string;
  phone: string;
  therapy: string;
  time: string;
  room: string;
  therapist: string;
  amount: string;
  status: string;
  oil: string;
}

interface AIFastCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAppointment: (app: Appointment) => void;
}

export default function AIFastCheckInModal({ isOpen, onClose, onAddAppointment }: AIFastCheckInModalProps) {
  const [naturalText, setNaturalText] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // Extracted Fields state
  const [guestName, setGuestName] = useState<string>("Walk-in Guest");
  const [phone, setPhone] = useState<string>("98200 99881");
  const [therapy, setTherapy] = useState<string>("Deep Tissue & Volcanic Knot Release (60m)");
  const [time, setTime] = useState<string>("03:30 PM");
  const [room, setRoom] = useState<string>("Single En-Suite 01 (Rain Shower)");
  const [therapist, setTherapist] = useState<string>("Pooja Sharma");
  const [amount, setAmount] = useState<string>("₹2,499");
  const [oil, setOil] = useState<string>("Alpine Eucalyptus");

  if (!isOpen) return null;

  const parseWithAI = (text: string) => {
    setIsParsing(true);
    const lower = text.toLowerCase();

    setTimeout(() => {
      // 1. Name
      const words = text.split(" ");
      if (words.length > 0 && !["aaj", "aaya", "massage", "deep", "swedish", "couple"].includes(words[0].toLowerCase())) {
        setGuestName(words[0] + (words[1] && !words[1].match(/^[0-9]/) && !["deep", "swedish", "60", "90"].includes(words[1].toLowerCase()) ? " " + words[1] : ""));
      }

      // 2. Therapy & Amount
      if (lower.includes("couple") || lower.includes("anniversary") || lower.includes("dono")) {
        setTherapy("Royal Couple Rejuvenation Suite (90m)");
        setAmount("₹4,999");
        setRoom("VIP Couple Sanctuary Suite");
        setTherapist("Maya Devi & Deepak R.");
      } else if (lower.includes("stone") || lower.includes("basalt") || lower.includes("volcanic")) {
        setTherapy("Heated Volcanic Basalt Spine (75m)");
        setAmount("₹2,999");
        setRoom("Single En-Suite 02");
        setTherapist("Pooja Sharma");
      } else if (lower.includes("swedish") || lower.includes("relax")) {
        setTherapy("Swedish Classical Serenity Ritual (60m)");
        setAmount("₹2,199");
        setRoom("Single En-Suite 01");
        setTherapist("Ananya Roy");
      } else if (lower.includes("facial") || lower.includes("gold")) {
        setTherapy("24K Gold Cellular Renewal Facial (60m)");
        setAmount("₹2,999");
        setRoom("Facial Suite 03");
        setTherapist("Sunita K.");
      } else {
        setTherapy("Deep Tissue & Volcanic Knot Release (60m)");
        setAmount("₹2,499");
        setRoom("Single En-Suite 01 (Rain Shower)");
        setTherapist("Pooja Sharma");
      }

      // 3. Time
      const timeMatch = text.match(/([0-1]?[0-9]|2[0-3])(:[0-5][0-9])?\s*(am|pm|baje)/i);
      if (timeMatch) {
        setTime(timeMatch[0].toUpperCase().replace("BAJE", "PM"));
      }

      // 4. Oil
      if (lower.includes("lavender")) setOil("Kashmir Lavender");
      else if (lower.includes("sandalwood")) setOil("Royal Sandalwood");
      else if (lower.includes("bergamot")) setOil("Italian Bergamot");
      else setOil("Alpine Eucalyptus");

      setIsParsing(false);
    }, 400);
  };

  const handleApplyPreset = (presetText: string) => {
    setNaturalText(presetText);
    parseWithAI(presetText);
  };

  const handleConfirm = () => {
    const newApp: Appointment = {
      id: `ALX-${Math.floor(100000 + Math.random() * 900000)}`,
      name: guestName,
      phone: phone,
      therapy: therapy,
      time: time,
      room: room,
      therapist: therapist,
      amount: amount,
      status: "Checked In",
      oil: oil,
    };

    onAddAppointment(newApp);
    onClose();

    // Prepare WhatsApp slip
    const text = `*ALEXA SPA — VIP APPOINTMENT PASS*\n\nGuest: *${newApp.name}*\nBooking ID: *${newApp.id}*\nTherapy: *${newApp.therapy}*\nTime: *${newApp.time} Today*\nAssigned Room: *${newApp.room}*\nMaster Therapist: *${newApp.therapist}*\nCustom Oil: *${newApp.oil}*\nTotal Amount: *${newApp.amount} (Paid)*\n\n_Attached hot rain shower & fresh sterilized kit ready._`;
    window.open(`https://wa.me/91${newApp.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fadeIn select-none">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0c1218] border border-[#c5a880]/40 shadow-2xl p-6 sm:p-9 text-[#f7f4ee] space-y-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#c5a880]/20 border border-[#c5a880]/50 flex items-center justify-center text-[#c5a880]">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-serif font-bold text-white flex items-center gap-3">
                AI FAST WALK-IN CHECK-IN
                <span className="px-3 py-1 rounded-full bg-[#c5a880]/20 text-[#d9bb8e] text-xs font-mono font-bold border border-[#c5a880]/30">
                  NATURAL LANGUAGE
                </span>
              </h3>
              <p className="text-xs sm:text-sm font-mono text-neutral-300 mt-1">
                Type in simple Hinglish or English — AI extracts all booking fields automatically.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Natural Input Box */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-[#d9bb8e] font-bold block">
            TYPE WALK-IN DETAILS IN HINGLISH OR ENGLISH:
          </label>
          <div className="relative">
            <input
              type="text"
              value={naturalText}
              onChange={(e) => {
                setNaturalText(e.target.value);
                parseWithAI(e.target.value);
              }}
              placeholder="e.g. Vikram Malhotra aaya hai 60m Deep Tissue 3:30 PM cash with eucalyptus"
              className="w-full bg-[#080c0f] border border-white/20 focus:border-[#c5a880] rounded-2xl px-5 py-4 text-base text-white focus:outline-none transition-all placeholder:text-neutral-500 font-sans"
            />
            {isParsing && (
              <span className="absolute right-5 top-4 text-sm text-[#d9bb8e] flex items-center gap-2 animate-pulse font-mono font-bold">
                <Sparkles className="w-4 h-4" /> AI Parsing...
              </span>
            )}
          </div>

          {/* Quick Smart Presets */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <span className="text-xs font-mono text-neutral-400 self-center font-bold">Quick Presets:</span>
            {[
              "Vikram - 60m Deep Tissue 3:30 PM",
              "Ananya & Rohan - Couple Suite 90m 4 PM",
              "Dr. Verma - Volcanic Stones 75m 5 PM",
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => handleApplyPreset(p)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#c5a880]/20 border border-white/15 hover:border-[#c5a880] text-xs font-mono text-[#d9bb8e] transition-all cursor-pointer font-semibold"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        {/* Extracted Fields Preview Box */}
        <div className="p-6 rounded-3xl bg-[#080c0f] border border-white/15 space-y-5 shadow-inner">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d9bb8e] font-bold">
              AI AUTO-CONFIGURED APPOINTMENT SLIP:
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">● 100% Ready to Check In</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-neutral-400 uppercase block font-bold">GUEST NAME</span>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-[#121922] border border-white/15 rounded-xl px-3 py-2 font-serif text-white text-base focus:outline-none focus:border-[#c5a880] font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono text-neutral-400 uppercase block font-bold">TIME SLOT</span>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#121922] border border-white/15 rounded-xl px-3 py-2 font-mono text-[#d9bb8e] text-base focus:outline-none focus:border-[#c5a880] font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono text-neutral-400 uppercase block font-bold">ASSIGNED ROOM</span>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-[#121922] border border-white/15 rounded-xl px-3 py-2 font-mono text-white text-sm focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono text-neutral-400 uppercase block font-bold">PRICE</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#121922] border border-white/15 rounded-xl px-3 py-2 font-mono font-bold text-[#d9bb8e] text-base focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-2 border-t border-white/10">
            <div>
              <span className="text-xs font-mono text-neutral-400 uppercase block font-bold">THERAPY</span>
              <span className="text-sm font-sans text-white block mt-1 font-semibold">{therapy}</span>
            </div>
            <div>
              <span className="text-xs font-mono text-neutral-400 uppercase block font-bold">THERAPIST & OIL</span>
              <span className="text-sm font-mono text-[#d9bb8e] block mt-1 font-semibold">{therapist} • {oil}</span>
            </div>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-full border border-white/20 text-sm text-neutral-300 hover:text-white transition-all cursor-pointer font-bold"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="flex-1 sm:flex-none px-9 py-4 rounded-full bg-[#c5a880] hover:brightness-110 text-[#07090b] text-sm font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-[#c5a880]/30 transition-all"
          >
            <Check className="w-5 h-5" />
            <span>Confirm & Send WhatsApp Digital Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
}
