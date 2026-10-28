"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLink: (sectionId: string) => void;
  onOpenReservation: () => void;
}

const MENU_ITEMS = [
  {
    num: "01",
    title: "HOME",
    tagline: "WELCOME TO ALEXA SPA",
    target: "hero",
    description: "Experience our luxury day spa ambience, authentic warm oil massages, and private suites.",
  },
  {
    num: "02",
    title: "MASSAGE SERVICES & PRICES",
    tagline: "MASSAGES, COUPLES & SCRUBS (FROM ₹2,000)",
    target: "rituals",
    description: "Dry, Aroma, Swedish, Deep Tissue, Signature and Four Hand massages, plus Body Scrub.",
  },
  {
    num: "03",
    title: "COUPLE MASSAGE",
    tagline: "COUPLE MASSAGE FOR 2 (FROM ₹5,000)",
    target: "couple-suite",
    description: "Side-by-side massages for two, with a jacuzzi option.",
  },
  {
    num: "04",
    title: "BOOK AN APPOINTMENT",
    tagline: "INSTANT ONLINE & WHATSAPP PASS",
    target: "reservation",
    description: "Choose your date, time slot, preferred therapist gender, and receive an instant booking pass.",
  },
  {
    num: "05",
    title: "SPA OWNER CRM & ADMIN",
    tagline: "REVENUE, SLOTS & AI STUDIO",
    target: "admin",
    description: "Executive operations dashboard, appointment roster, and AI WhatsApp campaign studio.",
  },
];

export default function NavigationDrawer({
  isOpen,
  onClose,
  onSelectLink,
  onOpenReservation,
}: NavigationDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (drawerRef.current) {
        gsap.fromTo(
          drawerRef.current,
          { opacity: 0, scale: 1.03 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
        );
      }
      if (linksRef.current.length > 0) {
        gsap.fromTo(
          linksRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.15 }
        );
      }
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleItemClick = (target: string) => {
    onClose();
    if (target === "reservation") {
      setTimeout(() => {
        onOpenReservation();
      }, 300);
    } else {
      onSelectLink(target);
    }
  };

  const activeItem = MENU_ITEMS[hoveredIndex] || MENU_ITEMS[0];

  return (
    <div
      ref={drawerRef}
      data-lenis-prevent
      className="fixed inset-0 z-[90] flex flex-col justify-between bg-[#07090b]/98 backdrop-blur-2xl text-[#f7f4ee] p-6 sm:p-12 md:p-16 select-none animate-fadeIn"
    >
      {/* Top Header of Drawer */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#c5a880] animate-pulse" />
          <span className="text-xs sm:text-sm tracking-[0.4em] uppercase font-serif text-[#f7f4ee]">
            ALEXA SPA • NAVIGATION
          </span>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#c5a880]/30 text-xs font-mono text-[#c5a880] hover:bg-[#c5a880]/15 hover:border-[#c5a880] transition-all cursor-pointer"
        >
          <span>CLOSE</span>
          <span className="text-sm font-bold">✕</span>
        </button>
      </div>

      {/* Main Center Grid: Links Left, Editorial Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center">
        {/* Navigation Links Column */}
        <div className="lg:col-span-7 space-y-4">
          {MENU_ITEMS.map((item, idx) => (
            <div
              key={item.num}
              ref={(el) => {
                linksRef.current[idx] = el;
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onClick={() => handleItemClick(item.target)}
              className="group flex items-baseline gap-4 sm:gap-6 py-2 sm:py-3 border-b border-white/5 hover:border-[#c5a880]/40 transition-all cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-mono text-[#c5a880] tracking-widest transition-transform group-hover:translate-x-1">
                {item.num}
              </span>
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-serif font-light tracking-[0.1em] text-[#e8ded2]/80 group-hover:text-[#f7f4ee] group-hover:translate-x-2 transition-all duration-300">
                {item.title}
              </h3>
            </div>
          ))}
        </div>

        {/* Dynamic Editorial Preview Column */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-center p-8 rounded-2xl bg-[#0e1318]/60 border border-[#c5a880]/20 space-y-4">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#c5a880]">
            INDEX {activeItem.num} • {activeItem.tagline}
          </span>
          <h4 className="text-2xl font-serif tracking-wider text-[#f7f4ee]">
            {activeItem.title}
          </h4>
          <p className="text-xs text-[#e8ded2]/70 font-sans leading-relaxed">
            {activeItem.description}
          </p>
          <div className="pt-2">
            <span className="text-[10px] font-mono tracking-widest text-[#c5a880]/80">
              CLICK TO NAVIGATE →
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-6 text-[10px] font-mono text-[#e8ded2]/50 gap-3">
        <span>ALEXA SPA • SANGLI • KARAD</span>
        <span className="text-[#c5a880]">OPEN 7 DAYS • SANGLI 10 AM – 8 PM • KARAD 10 AM – 9 PM</span>
      </div>
    </div>
  );
}
