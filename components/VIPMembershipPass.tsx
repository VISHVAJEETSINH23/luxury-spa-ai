"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Crown, QrCode, MessageCircle, ArrowRight, ShieldCheck, Download } from "lucide-react";

interface VIPMembershipPassProps {
  onOpenReservation: (experienceId?: string, promoCode?: string) => void;
}

export default function VIPMembershipPass({ onOpenReservation }: VIPMembershipPassProps) {
  const [guestName, setGuestName] = useState<string>("Valued Guest");
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [glarePos, setGlarePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 16;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  // Device orientation tilt for mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const rY = Math.max(-15, Math.min(15, e.gamma / 2));
        const rX = Math.max(-15, Math.min(15, (e.beta - 45) / 2));
        setRotateX(rX);
        setRotateY(rY);
        setGlarePos({ x: 50 + rY * 2, y: 50 + rX * 2 });
      }
    };

    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, []);

  const handleShareWhatsApp = () => {
    const text = `Namaste Alexa Spa! I would like to activate my VIP Obsidian Member Pass for "${guestName}". Please link my pass to my phone number and apply my 30% VIP30 discount code on my next visit.`;
    window.open(`https://wa.me/919820012345?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="vip-pass" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto select-none">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/25 text-[#c5a880] text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em]">
          <Crown className="w-3.5 h-3.5 text-[#c5a880]" />
          <span>Complimentary VIP Sanctuary Tier</span>
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-light text-[#f7f4ee] leading-tight">
          Your digital <span className="italic text-[#c5a880]">Obsidian VIP Pass.</span>
        </h2>

        <p className="text-sm sm:text-base text-[#e8ded2]/75 font-sans leading-relaxed">
          Hover or tilt your device to view the dynamic holographic reflection. Personalize your name
          to claim priority suite reservation and 30% member privileges.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-center max-w-5xl mx-auto">
        {/* Left: 3D Holographic Card Display */}
        <div className="lg:col-span-7 flex justify-center perspective-[1200px]">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className="relative w-full max-w-md aspect-[1.586/1] rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#181f26] via-[#0d1216] to-[#06080a] border border-[#c5a880]/50 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden cursor-pointer transform-gpu"
          >
            {/* Holographic Specular Rainbow Glare */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-color-dodge transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 215, 0, 0.45) 0%, rgba(0, 255, 200, 0.25) 28%, rgba(255, 0, 128, 0.15) 55%, transparent 80%)`,
              }}
            />

            {/* Subtle Metallic Brushed Texture Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#c5a880_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

            {/* Card Content */}
            <div className="relative z-10 h-full flex flex-col justify-between text-[#f7f4ee]">
              {/* Top Row: Brand & Tier Chip */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-serif text-xl tracking-[0.24em] uppercase text-white font-bold block">
                    ALEXA <span className="text-[#c5a880] text-xs font-mono font-normal">SPA</span>
                  </span>
                  <span className="text-[9px] font-mono text-[#c5a880] tracking-widest uppercase block">
                    SANCTUARY CLUB
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c5a880]/20 border border-[#c5a880] text-[#f7f4ee] text-[10px] font-mono font-bold tracking-wider">
                  <Crown className="w-3 h-3 text-[#c5a880]" />
                  <span>OBSIDIAN ELITE</span>
                </div>
              </div>

              {/* Middle Row: Gold Chip & Hologram Foil */}
              <div className="flex items-center justify-between my-auto py-2">
                {/* EMV Microchip */}
                <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#aa7c11] border border-amber-300/40 p-1 flex flex-col justify-between shadow-inner">
                  <div className="w-full h-px bg-black/30" />
                  <div className="w-full h-px bg-black/30" />
                  <div className="w-full h-px bg-black/30" />
                </div>

                {/* Member ID */}
                <span className="font-mono text-xs text-[#e4d3ba]/80 tracking-[0.25em]">
                  ALX-88219-VIP
                </span>
              </div>

              {/* Bottom Row: Guest Name & Perks */}
              <div className="flex items-end justify-between border-t border-white/10 pt-3">
                <div>
                  <span className="text-[9px] font-mono text-[#e8ded2]/50 uppercase tracking-widest block">
                    MEMBER NAME
                  </span>
                  <h4 className="text-base sm:text-lg font-serif tracking-wider text-white capitalize font-light">
                    {guestName || "Valued Guest"}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono text-[#c5a880] uppercase tracking-widest block">
                    PRIVILEGE CODE
                  </span>
                  <span className="text-xs font-mono font-bold text-white tracking-wider">
                    VIP30 (30% OFF)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Personalization Form & Benefits */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xl sm:text-2xl font-serif text-[#f7f4ee] font-light">
              Personalize your member pass
            </h3>
            <p className="text-xs text-[#e8ded2]/70 font-sans leading-relaxed">
              Enter your name to generate your personalized Obsidian VIP Pass. This gives you direct access
              to priority private suite allocation and complimentary aromatherapy upgrades.
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#c5a880] block">
              ENTER YOUR FULL NAME:
            </label>
            <input
              type="text"
              value={guestName === "Valued Guest" ? "" : guestName}
              placeholder="e.g. Vikram Singhania"
              onChange={(e) => setGuestName(e.target.value || "Valued Guest")}
              className="w-full bg-[#10151a] border border-white/15 focus:border-[#c5a880] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-white/30"
            />
          </div>

          {/* Member Privileges List */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-[#0e1318] border border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#c5a880] block">
              INCLUDED VIP PERKS:
            </span>
            <div className="space-y-1.5 text-xs text-[#e4d3ba]">
              <div className="flex items-center gap-2">
                <span className="text-[#c5a880]">✦</span>
                <span>Flat 30% Off on all 60/90-Min Massages (Code: VIP30)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c5a880]">✦</span>
                <span>Complimentary 15-Min Volcanic Basalt Stone Upgrade</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c5a880]">✦</span>
                <span>Priority WhatsApp Concierge slot reservation</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-3.5 px-5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Activate on WhatsApp</span>
            </button>

            <button
              onClick={() => onOpenReservation(undefined, "VIP30")}
              className="flex-1 py-3.5 px-5 rounded-full bg-[#c5a880] hover:brightness-110 text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#c5a880]/20"
            >
              <span>Book With VIP30</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
