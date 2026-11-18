"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Volume2, Sliders } from "lucide-react";
import { scrollToSection, scrollToTop } from "@/lib/scroll";

/** `section` is the element the link tracks while scrolling; `match` is the
    pathname that lights it up when the link leaves this page. */
const NAV_LINKS: { href: string; label: string; section: string; match?: string }[] = [
  { href: "/", label: "Home", section: "hero", match: "/" },
  { href: "/#rituals", label: "Services", section: "rituals" },
  { href: "/#couple-suite", label: "Couple Suite", section: "couple-suite" },
  { href: "/#reviews", label: "Reviews", section: "reviews" },
  { href: "/#contact", label: "Contact", section: "contact" },
];


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
    <header className="fixed inset-x-0 top-2 sm:top-5 z-50 flex justify-center px-2 sm:px-6 select-none pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center justify-between w-full max-w-[96vw] sm:max-w-max rounded-full border backdrop-blur-2xl transition-all duration-500 ${
          scrolled
            ? "border-white/[0.09] bg-[#07090b]/90 py-2 sm:py-3 pl-3.5 sm:pl-8 pr-2 sm:pr-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_22px_60px_-28px_rgba(0,0,0,0.95)]"
            : "border-white/[0.08] bg-[#07090b]/70 py-2.5 sm:py-3.5 pl-3.5 sm:pl-9 pr-2 sm:pr-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        }`}
      >
        <Link href="/" className="group flex shrink-0 items-center cursor-pointer">
          <span className="whitespace-nowrap font-serif text-sm xs:text-base sm:text-[1.6rem] font-light uppercase leading-none tracking-[0.14em] sm:tracking-[0.34em] text-[#f7f4ee] transition-colors duration-300 group-hover:text-[#c5a880]">
            Alexa
          </span>
          <span className="ml-[0.25em] hidden sm:inline whitespace-nowrap font-mono text-[9px] uppercase leading-none tracking-[0.34em] text-[#c5a880]/80">
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 ml-auto pl-1 sm:pl-2">
          {/* ASMR Soundscape Studio Trigger */}
          {onOpenAudioStudio && (
            <button
              onClick={onOpenAudioStudio}
              aria-label="Open ASMR Sanctuary Soundscape Mixer"
              title="ASMR Soundscape Studio"
              className="hidden h-11 w-11 shrink-0 sm:flex items-center justify-center rounded-full border border-white/[0.12] bg-[#0b0f12]/80 hover:border-[#c5a880]/70 text-[#c5a880] transition-all duration-300 cursor-pointer group shadow-sm hover:scale-105"
            >
              <Sliders className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
          )}

          {/* The guest's own booking: always in view, phone included */}
          <Link
            href="/booking"
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/[0.14] bg-[#0b0f12]/80 px-2.5 sm:px-5 py-2 sm:py-3 font-sans text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.05em] sm:tracking-[0.2em] text-[#e4d3ba] transition-colors duration-300 hover:border-[#c5a880]/70"
          >
            <CalendarCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#c5a880]" />
            <span className="hidden xs:inline">My Booking</span>
            <span className="xs:hidden">Booking</span>
          </Link>

          {/* Reserve CTA */}
          <button
            onClick={onOpenReservation}
            className="group relative shrink-0 overflow-hidden whitespace-nowrap rounded-full border border-[#c5a880]/60 bg-gradient-to-r from-[#b38f5f]/30 to-[#c5a880]/40 px-3 sm:px-7 py-2 sm:py-3 font-sans text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.24em] text-[#f7f4ee] hover:text-[#07090b] transition-colors duration-500 cursor-pointer"
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
            className="group flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 flex-col items-center justify-center gap-[4px] rounded-full border border-white/[0.12] bg-[#0b0f12]/80 transition-colors duration-300 hover:border-[#c5a880]/60 cursor-pointer"
          >
            <span className="h-px w-[14px] sm:w-[17px] bg-[#e8ded2]/80 transition-all duration-300 group-hover:w-[13px] group-hover:bg-[#c5a880]" />
            <span className="h-px w-[10px] sm:w-[11px] bg-[#e8ded2]/80 transition-all duration-300 group-hover:w-[17px] group-hover:bg-[#c5a880]" />
          </button>
        </div>
      </div>
    </header>
  );
}
