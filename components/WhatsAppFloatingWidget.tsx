"use client";

import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { FLOATING_OPEN_EVENT } from "@/components/BookingChatbot";
import { BRANCH_LIST } from "@/lib/branches";

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

/** Branches whose WhatsApp number has been filled in lib/branches.ts. */
const REACHABLE = BRANCH_LIST.filter((b) => b.whatsapp);

export default function WhatsAppFloatingWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const onOtherOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== "whatsapp") setIsOpen(false);
    };
    window.addEventListener(FLOATING_OPEN_EVENT, onOtherOpen);
    return () => window.removeEventListener(FLOATING_OPEN_EVENT, onOtherOpen);
  }, []);

  // No number configured yet: show nothing rather than a dead or wrong link.
  if (REACHABLE.length === 0) return null;

  const toggle = () => {
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent(FLOATING_OPEN_EVENT, { detail: "whatsapp" }));
    }
    setIsOpen(!isOpen);
  };

  const chat = (number: string, branchName: string) => {
    const text = `Hi ${branchName}, I would like to book a massage.`;
    window.open(`https://wa.me/91${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 select-none">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[calc(100vw-2.5rem)] max-w-[320px] rounded-3xl bg-[#0b0f12]/95 border border-[#25D366]/40 p-4 sm:p-5 shadow-2xl text-[#f7f4ee] space-y-3 animate-fadeIn backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                <WhatsAppIcon className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-xs font-serif font-bold tracking-wide">Chat with Alexa Salon & Spa</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#e8ded2]/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Close WhatsApp options"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-[#e8ded2]/80">Which branch would you like to message?</p>

          {REACHABLE.map((branch) => (
            <button
              key={branch.id}
              onClick={() => chat(branch.whatsapp!, branch.name)}
              className="w-full text-left p-3 rounded-xl bg-[#090d10] border border-white/5 hover:border-[#25D366]/50 text-sm text-[#e4d3ba] flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#25D366]" /> {branch.city}
              </span>
              <span className="text-emerald-400">→</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={toggle}
        aria-label="Chat on WhatsApp"
        className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#20bd5a] to-[#25D366] text-white shadow-xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/25 cursor-pointer"
      >
        <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      </button>
    </div>
  );
}
