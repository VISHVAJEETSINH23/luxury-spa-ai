"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Volume2, Sliders } from "lucide-react";
import { scrollToSection, scrollToTop } from "@/lib/scroll";

/** `section` is the element the link tracks while scrolling; `match` is the
    pathname that lights it up when the link leaves this page. */
const NAV_LINKS: { href: string; label: string; section: string; match?: string }[] = [
  { href: "/", label: "Home", section: "hero", match: "/" },
  { href: "/#rituals", label: "Services", section: "rituals" },
  { href: "/#sanctuary-tour", label: "360° Suite", section: "sanctuary-tour" },
  { href: "/#blend-oil", label: "Blend Oil", section: "blend-oil" },
  { href: "/#vip-pass", label: "VIP Pass", section: "vip-pass" },
  { href: "/#couple-suite", label: "Couple Suite", section: "couple-suite" },
  { href: "/#reviews", label: "Reviews", section: "reviews" },
  { href: "/#contact", label: "Contact", section: "contact" },
];

const SPA_PHONE_DISPLAY = "+91 98200 12345";
const SPA_PHONE_TEL = "+919820012345";

interface LuxuryNavbarProps {
  onOpenMenu: () => void;
  onOpenReservation: () => void;
  onOpenAudioStudio?: () => void;
  isAudioActive?: boolean;
}

export default function LuxuryNavbar({
  onOpenMenu,
  onOpenReservation,
  onOpenAudioStudio,
  isAudioActive,
}: LuxuryNavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("hero");

  useEffect(() => {
    let ticking = false;

    const measure = () => {
      ticking = false;
      const y = window.scrollY;
      setScrolled(y > 30);

      if (pathname !== "/") return;

      const line = y + 140;
      let current = NAV_LINKS[0].section;

      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.section);
        if (!el) continue;
        if (el.getBoundingClientRect().top + y <= line) current = link.section;
      }

      if (y + window.innerHeight >= document.body.scrollHeight - 8) {
        current = NAV_LINKS[NAV_LINKS.length - 1].section;
      }

      setActiveSection(current);
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href === "/" && pathname === "/") {
      event.preventDefault();
      scrollToTop();
      return;
    }
    if (!href.startsWith("/#") || pathname !== "/") return;
    event.preventDefault();
    scrollToSection(href.slice(2));
  };

  return (
    <header className="fixed inset-x-0 top-4 sm:top-5 z-50 flex justify-center px-4 select-none pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center rounded-full border backdrop-blur-2xl transition-all duration-500 ${
          scrolled
            ? "border-white/[0.09] bg-[#07090b]/85 py-2 pl-7 pr-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_22px_60px_-28px_rgba(0,0,0,0.95)]"
            : "border-white/[0.07] bg-[#07090b]/55 py-2.5 pl-8 pr-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
        }`}
      >
        <Link href="/" className="group flex shrink-0 items-center cursor-pointer">
          <span className="whitespace-nowrap font-serif text-xl sm:text-[1.6rem] font-light uppercase leading-none tracking-[0.34em] text-[#f7f4ee] transition-colors duration-300 group-hover:text-[#c5a880]">
            Alexa
          </span>
          <span className="ml-[0.34em] whitespace-nowrap font-mono text-[9px] uppercase leading-none tracking-[0.34em] text-[#c5a880]/80">
            Spa
          </span>
        </Link>

        <span className="hidden lg:block mx-6 xl:mx-8 h-5 w-px bg-white/[0.12]" />

        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 whitespace-nowrap font-sans text-[11px] uppercase tracking-[0.2em]">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === "/"
                ? activeSection === link.section
                : link.match === pathname;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleNavClick(event, link.href)}
                aria-current={isActive ? "true" : undefined}
                className={`group relative py-1.5 transition-colors duration-300 hover:text-[#f7f4ee] ${
                  isActive ? "text-[#c5a880]" : "text-[#e8ded2]/65"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-px left-0 right-0 h-px origin-center bg-[#c5a880] transition-all duration-500 ease-out ${
                    isActive
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-40"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <span className="hidden sm:block mx-4 lg:mx-6 h-5 w-px bg-white/[0.12]" />

        <div className="flex shrink-0 items-center gap-2">
          {/* ASMR Soundscape Studio Trigger */}
          {onOpenAudioStudio && (
            <button
              onClick={onOpenAudioStudio}
              aria-label="Open ASMR Sanctuary Soundscape Mixer"
              title="ASMR Soundscape Studio"
              className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-[#0b0f12]/80 hover:border-[#c5a880]/70 text-[#c5a880] transition-all duration-300 cursor-pointer group shadow-sm hover:scale-105"
            >
              <Sliders className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
          )}

          {/* Direct Phone link */}
          <a
            href={`tel:${SPA_PHONE_TEL}`}
            aria-label={`Call Alexa Spa on ${SPA_PHONE_DISPLAY}`}
            className="hidden sm:flex shrink-0 items-center gap-2 pr-1 text-[#e8ded2]/60 transition-colors duration-300 hover:text-[#c5a880]"
          >
            <Phone className="w-[15px] h-[15px] shrink-0" strokeWidth={1.5} />
            <span className="hidden 2xl:inline whitespace-nowrap font-mono text-[11px] tracking-[0.12em]">
              {SPA_PHONE_DISPLAY}
            </span>
          </a>

          {/* Reserve CTA */}
          <button
            onClick={onOpenReservation}
            className="group relative shrink-0 overflow-hidden whitespace-nowrap rounded-full border border-[#c5a880]/50 px-6 sm:px-7 py-2.5 sm:py-3 font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-[#e4d3ba] transition-colors duration-500 hover:text-[#07090b] cursor-pointer"
          >
            <span
              aria-hidden
              className="absolute inset-0 origin-bottom scale-y-0 bg-[#c5a880] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
            />
            <span className="relative">Reserve</span>
          </button>

          {/* Menu Drawer Hamburger */}
          <button
            onClick={onOpenMenu}
            aria-label="Open menu"
            title="Open menu"
            className="group flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full border border-white/[0.1] transition-colors duration-300 hover:border-[#c5a880]/60 cursor-pointer"
          >
            <span className="h-px w-[17px] bg-[#e8ded2]/70 transition-all duration-300 group-hover:w-[13px] group-hover:bg-[#c5a880]" />
            <span className="h-px w-[11px] bg-[#e8ded2]/70 transition-all duration-300 group-hover:w-[17px] group-hover:bg-[#c5a880]" />
          </button>
        </div>
      </div>
    </header>
  );
}
