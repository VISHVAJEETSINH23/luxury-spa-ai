"use client";

import { useState } from "react";
import { X, Send, Sparkles, Clock, MapPin, ExternalLink } from "lucide-react";

const SPA_WHATSAPP_NUMBER = "919820012345"; // Configurable Spa WhatsApp

export function WhatsAppIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function WhatsAppFloatingWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customMsg, setCustomMsg] = useState<string>("");

  const handleSendWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${SPA_WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 select-none">
      {/* Micro-Chat Popover */}
      {isOpen && (
        <div className="absolute bottom-16 sm:bottom-18 right-0 w-[calc(100vw-2.5rem)] max-w-[340px] sm:max-w-sm rounded-3xl bg-[#0b0f12]/95 border border-[#25D366]/40 p-4 sm:p-5 shadow-2xl text-[#f7f4ee] space-y-3.5 animate-fadeIn backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md shadow-[#25D366]/30">
                <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold text-[#f7f4ee] tracking-wide flex items-center gap-1.5">
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
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#e8ded2]/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Close WhatsApp chat popup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Greeting Bubble */}
          <div className="p-3 rounded-2xl bg-[#141b22] border border-white/5 text-xs text-[#e8ded2]/90 leading-relaxed font-sans">
            Namaste! Welcome to Alexa Spa. Tap an option below to connect with our concierge directly on WhatsApp:
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
              className="w-full text-left p-2.5 rounded-xl bg-[#090d10] border border-white/5 hover:border-[#25D366]/50 text-xs font-sans text-[#e4d3ba] flex items-center justify-between transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#25D366]" /> Book a Slot for Today
              </span>
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
            </button>

            <button
              onClick={() =>
                handleSendWhatsApp(
                  "Hi, I saw the Happy Hours Weekday offer (₹1,799). Can I book for 2:30 PM this afternoon?"
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-[#090d10] border border-white/5 hover:border-[#25D366]/50 text-xs font-sans text-[#e4d3ba] flex items-center justify-between transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" /> Claim Happy Hours (₹1,799)
              </span>
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
            </button>

            <button
              onClick={() =>
                handleSendWhatsApp(
                  "Hi, could you please share the exact building location, floor, and valet parking details?"
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-[#090d10] border border-white/5 hover:border-[#25D366]/50 text-xs font-sans text-[#e4d3ba] flex items-center justify-between transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Location & Valet Parking
              </span>
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
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
              placeholder="Type custom message..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="flex-1 bg-[#10151a] border border-white/10 rounded-full px-3.5 py-2 text-xs text-[#f7f4ee] placeholder-white/40 focus:outline-none focus:border-[#25D366]"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#25D366] text-[#07090b] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md shadow-[#25D366]/30"
              title="Send on WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Direct WhatsApp Link fallback */}
          <div className="text-center pt-1">
            <button
              onClick={() => handleSendWhatsApp("Hi Alexa Spa, I would like to make an inquiry.")}
              className="text-[10px] font-mono text-[#25D366] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              Open Direct WhatsApp Chat <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Compact Floating Trigger Button */}
      <div className="relative group">
        {/* Tooltip on hover for desktop */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-full bg-[#0b0f12]/95 border border-white/10 text-[#f7f4ee] text-xs font-sans font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-xl backdrop-blur-md hidden sm:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span>Chat on WhatsApp</span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="WhatsApp Concierge"
          className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#20bd5a] to-[#25D366] text-white shadow-xl shadow-[#25D366]/40 hover:shadow-2xl hover:shadow-[#25D366]/60 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/25 cursor-pointer"
        >
          <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm group-hover:scale-105 transition-transform" />

          {/* Active online pulse dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#07090b]"></span>
          </span>
        </button>
      </div>
    </div>
  );
}
