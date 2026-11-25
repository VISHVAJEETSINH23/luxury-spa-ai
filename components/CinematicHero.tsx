"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Lenis from "lenis";
import { scrollToSection } from "@/lib/scroll";

interface CinematicHeroProps {
  onOpenMenu?: () => void;
  onOpenReservation?: () => void;
  onProgressUpdate?: (progress: number) => void;
}

export default function CinematicHero({
  onOpenReservation,
  onProgressUpdate,
}: CinematicHeroProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize smooth scrolling: Native 120Hz GPU touch scrolling on mobile, Lenis on desktop
  useEffect(() => {
    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);

    if (isTouch) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
      prevent: (node) =>
        !!node.closest?.("form, [role='dialog'], [aria-modal='true'], [data-lenis-prevent]"),
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (typeof window !== "undefined") delete window.__lenis;
    };
  }, []);

  // Programmatically trigger video playback for mobile browsers (iOS Low Power, Android battery savers)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay prevented by browser power-saving mode, poster remains visible
      });
    }
  }, []);

  const handleScrollToRituals = () => {
    scrollToSection("rituals");
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] w-full flex flex-col justify-between bg-[#07090b] text-[#f7f4ee] overflow-hidden selection:bg-[#c5a880]/30 selection:text-[#f7f4ee]"
    >
      {/* 
        ========================================================================
        FULL CLARITY HD ALEXA VIDEO (HARDWARE-ACCELERATED NATIVE PLAYBACK)
        Mobile & Desktop: Guaranteed non-blank instant image foundation + seamless video
        ========================================================================
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#07090b]">
        {/* Instant 0ms Visual Foundation: Matches the exact first frame of the video so screen is NEVER blank */}
        <div className="absolute inset-0">
          <Image
            src="/video/hero-alexa-poster.jpg"
            alt="Alexa Salon & Spa Sangli Karad"
            fill
            priority
            sizes="100vw"
            quality={90}
            className="object-cover object-center filter brightness-[0.92] contrast-[1.08]"
          />
        </div>

        {/* Hardware-Accelerated Ambient Video with exact first-frame poster */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/video/hero-alexa-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08]"
        >
          <source src="/video/hero-alexa.mp4" type="video/mp4" />
        </video>

        {/* Subtle, refined cinematic vignette: clean contrast for text, pristine room visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090b]/70 via-black/15 to-[#07090b]/85 pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>

      {/* Top Spacer for floating navbar clearance */}
      <div className="h-16 sm:h-28 w-full relative z-10 shrink-0" />

      {/* 
        ========================================================================
        MINIMALIST HAUTE-COUTURE CENTERPIECE (BREATHING SPACE & CLARITY)
        ========================================================================
      */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-8 py-2 sm:py-6 flex flex-col items-center text-center my-auto">
        {/* Discreet Monogram Eyebrow */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2.5 sm:mb-5">
          <span className="w-5 sm:w-12 h-px bg-[#c5a880]/60" />
          <span className="text-[9px] sm:text-xs tracking-[0.28em] sm:tracking-[0.45em] uppercase text-[#d9bb8e] font-mono">
            Sangli · Karad
          </span>
          <span className="w-5 sm:w-12 h-px bg-[#c5a880]/60" />
        </div>

        {/* Clean Grand Title */}
        <h1 className="text-3xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-extralight tracking-[0.06em] sm:tracking-[0.14em] text-[#f7f4ee] uppercase leading-[1.08] sm:leading-[0.95] mb-2 sm:mb-4 text-shade-strong">
          Alexa Salon <span className="font-light italic text-[#e4d3ba]">&amp; Spa</span>
        </h1>

        {/* Serene Italic Subtitle */}
        <p className="text-sm sm:text-3xl md:text-4xl font-serif italic font-light text-[#f0dfc2] tracking-wide mb-4 sm:mb-8 text-shade-strong max-w-xl mx-auto">
          Private rooms, <span className="text-[#e4d3ba]">attached hot shower</span> &amp; fresh linen.
        </p>

        {/* Minimalist Trust Line */}
        <div className="inline-flex items-center gap-2 mb-6 sm:mb-10 px-3.5 sm:px-4 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs text-white/90">
          <span className="text-[#d4af37]">★ 4.9</span>
          <span className="text-white/40">·</span>
          <span>420+ Verified Reviews</span>
          <span className="text-white/40">·</span>
          <span className="text-[#d9bb8e]">Private En-Suite</span>
        </div>

        {/* Effortless Dual Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5 w-full max-w-xs sm:max-w-none">
          <button
            onClick={() => onOpenReservation?.()}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#b38f5f] via-[#c5a880] to-[#d9bb8e] text-[#07090b] font-sans text-xs sm:text-sm tracking-[0.14em] sm:tracking-[0.16em] font-bold uppercase shadow-2xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Reserve a Suite</span>
            <span className="text-base font-bold">→</span>
          </button>

          <button
            onClick={handleScrollToRituals}
            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[#e4d3ba] font-sans text-xs tracking-[0.12em] sm:tracking-[0.14em] uppercase hover:bg-white/10 hover:border-[#c5a880] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>View Rituals &amp; Prices</span>
            <span className="text-xs">↓</span>
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        QUIET LUXURY BOTTOM PROMPT
        ========================================================================
      */}
      <div className="relative z-10 w-full pb-5 sm:pb-8 flex flex-col items-center justify-center pointer-events-none shrink-0">
        <button
          onClick={handleScrollToRituals}
          className="pointer-events-auto flex flex-col items-center gap-1.5 text-[9px] sm:text-[10px] font-mono tracking-[0.3em] uppercase text-[#c5a880]/80 hover:text-white transition-colors cursor-pointer"
        >
          <span>SCROLL TO EXPLORE</span>
          <span className="animate-bounce text-xs">↓</span>
        </button>
      </div>
    </section>
  );
}
