"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Sparkles, Clock, MapPin, Gift } from "lucide-react";

const SPA_WHATSAPP_NUMBER = "919820012345"; // Configurable Spa WhatsApp

export default function WhatsAppFloatingWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customMsg, setCustomMsg] = useState<string>("");

  const handleSendWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${SPA_WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      {/* Micro-Chat Popover */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 rounded-3xl bg-[#0b0f12] border border-[#25D366]/40 p-5 shadow-2xl text-[#f7f4ee] space-y-4 animate-fadeIn backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#25D366]/20 border border-[#25D366] flex items-center justify-center text-[#25D366]">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold text-[#f7f4ee] tracking-wide">
                  ALEXA SPA CONCIERGE
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online • Instant Reply
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-[#e8ded2]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Greeting Bubble */}
          <div className="p-3 rounded-2xl bg-[#141b22] border border-white/5 text-xs text-[#e8ded2]/90 leading-relaxed font-sans">
            Namaste! Welcome to Alexa Spa. How can our front-desk concierge assist you today?
          </div>

          {/* Quick Action Chips */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-[#c5a880] uppercase tracking-wider block">
              QUICK INQUIRIES:
            </span>

            <button
              onClick={() =>
                handleSendWhatsApp(
                  "Hi Alexa Spa, I would like to book a 60-min Deep Tissue massage today. What slots are available?"
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-[#090d10] border border-white/5 hover:border-[#25D366]/50 text-xs font-sans text-[#e4d3ba] flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#25D366]" /> Book a Slot for Today
              </span>
              <span>→</span>
            </button>

            <button
              onClick={() =>
                handleSendWhatsApp(
                  "Hi, I saw the Happy Hours Weekday offer (₹1,799). Can I book for 2:30 PM this afternoon?"
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-[#090d10] border border-white/5 hover:border-[#25D366]/50 text-xs font-sans text-[#e4d3ba] flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" /> Claim Happy Hours (₹1,799)
              </span>
              <span>→</span>
            </button>

            <button
              onClick={() =>
                handleSendWhatsApp(
                  "Hi, could you please share the exact building location, floor, and valet parking details?"
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-[#090d10] border border-white/5 hover:border-[#25D366]/50 text-xs font-sans text-[#e4d3ba] flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Location & Valet Parking
              </span>
              <span>→</span>
            </button>
          </div>

          {/* Custom Message Sender */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customMsg.trim()) {
                handleSendWhatsApp(customMsg);
                setCustomMsg("");
              }
            }}
            className="flex items-center gap-2 pt-2 border-t border-white/10"
          >
            <input
              type="text"
              placeholder="Type your message..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="flex-1 bg-[#10151a] border border-white/10 rounded-full px-4 py-2 text-xs text-[#f7f4ee] focus:outline-none focus:border-[#25D366]"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#25D366] text-[#07090b] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] text-[#07090b] font-sans font-bold text-xs shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer shadow-[#25D366]/30 border-2 border-white/20"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 text-[#07090b] group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline font-sans tracking-wide">BOOK ON WHATSAPP</span>
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
      </button>
    </div>
  );
}
