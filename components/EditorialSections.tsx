"use client";

import Link from "next/link";
import ServicesMenu from "@/components/ServicesMenu";
import SanctuarySuiteTour from "@/components/SanctuarySuiteTour";
import AromatherapyCustomizer from "@/components/AromatherapyCustomizer";
import VIPMembershipPass from "@/components/VIPMembershipPass";
import FrontDeskLiveTicker from "@/components/FrontDeskLiveTicker";
import ReviewsWall from "@/components/ReviewsWall";
import BodyPainMapper from "@/components/BodyPainMapper";
import CoupleExperienceCustomizer from "@/components/CoupleExperienceCustomizer";
import GiftCardStudio from "@/components/GiftCardStudio";
import WavyBackground from "@/components/ui/blue-meshy-background";
import { MapPin, Phone, Clock, MessageCircle, Instagram, Facebook, Star } from "lucide-react";
import { scrollToSection } from "@/lib/scroll";

interface EditorialSectionsProps {
  onOpenReservation: (experienceId?: string, promoCode?: string) => void;
  onOpenAIDoctor?: () => void;
}

const TESTIMONIALS = [
  {
    name: "Vikram Malhotra",
    role: "Verified Google Review ★★★★★",
    quote:
      "The best deep tissue massage in the city. The private attached shower inside every room and single-use disposable kits show their commitment to 5-star hygiene.",
    therapy: "Deep Tissue & Hot Stone Relief",
  },
  {
    name: "Pooja & Sameer Khanna",
    role: "Verified Google Review ★★★★★",
    quote:
      "We booked the Royal Couple Suite for our anniversary. The rose petal bath, customized music, and synchronized massage were world-class. Worth every rupee!",
    therapy: "Royal Couple Sanctuary Suite",
  },
  {
    name: "Dr. Ananya Roy",
    role: "Verified Google Review ★★★★★",
    quote:
      "Working 12-hour shifts left my back in knots. Just one 75-min Balinese session melted away all stiffness. The therapist was exceptionally skilled.",
    therapy: "Balinese Aromatherapy & Warm Steam",
  },
];

export default function EditorialSections({ onOpenReservation, onOpenAIDoctor }: EditorialSectionsProps) {
  return (
    <WavyBackground className="relative w-full bg-[#07090b] text-[#f7f4ee] select-none z-20">
      {/* Short fades that join this panel to the hero above and the page below. */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#07090b] to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07090b] to-transparent pointer-events-none z-0" />

      {/* 
        ========================================================================
        0. LIVE FRONT DESK TELEMETRY & SANCTUARY READINESS TICKER
        ========================================================================
      */}
      <div className="relative z-10">
        <FrontDeskLiveTicker />
      </div>

      {/* 
        ========================================================================
        1. COMPLETE ALL-IN-ONE MASTER SERVICES & PRICE MENU (Immediately after hero)
        ========================================================================
      */}
      <section id="rituals" className="relative z-10 pt-8 scroll-mt-24">
        <ServicesMenu onOpenReservation={onOpenReservation} onOpenAIDoctor={onOpenAIDoctor} />
      </section>

      {/* 
        ========================================================================
        2. INTERACTIVE 360° VIP SANCTUARY SUITE HOTSPOT TOUR
        ========================================================================
      */}
      <section className="relative z-10 pt-12 px-5 sm:px-8 lg:px-12">
        <SanctuarySuiteTour onOpenReservation={(id) => onOpenReservation(id)} />
      </section>

      {/* 
        ========================================================================
        3. INTERACTIVE 3D ANATOMY PAIN MAPPER ("Where does it hurt?")
        ========================================================================
      */}
      <section className="relative z-10 pt-12 px-5 sm:px-8 lg:px-12">
        <BodyPainMapper onSelectTherapy={(therapyId) => onOpenReservation(therapyId)} />
      </section>

      {/* 
        ========================================================================
        4. "BLEND MY OIL" — INTERACTIVE AROMATHERAPY SCENT ATELIER
        ========================================================================
      */}
      <section className="relative z-10 pt-12 px-5 sm:px-8 lg:px-12">
        <AromatherapyCustomizer onOpenReservation={onOpenReservation} />
      </section>

      {/* 
        ========================================================================
        5. COUPLE SANCTUARY EXPERIENCE CUSTOMIZER
        ========================================================================
      */}
      <section id="couple-suite" className="relative z-10 pt-12 px-5 sm:px-8 lg:px-12 scroll-mt-24">
        <CoupleExperienceCustomizer onBookCouple={(id) => onOpenReservation(id)} />
      </section>

      {/* 
        ========================================================================
        6. 3D HOLOGRAPHIC OBSIDIAN VIP MEMBERSHIP PASS
        ========================================================================
      */}
      <section className="relative z-10 pt-12 px-5 sm:px-8 lg:px-12">
        <VIPMembershipPass onOpenReservation={onOpenReservation} />
      </section>

      {/* 
        ========================================================================
        7. DIGITAL GIFT VOUCHER STUDIO (WhatsApp delivery)
        ========================================================================
      */}
      <section className="relative z-10 pt-12 px-5 sm:px-8 lg:px-12">
        <GiftCardStudio />
      </section>

      {/* 
        ========================================================================
        5. 100% 5-STAR HYGIENE & QUALITY ASSURANCE VAULT
        ========================================================================
      */}
      {/*
        ========================================================================
        ABOUT THE SANCTUARY
        Below this point the black card panels are gone: sections are held
        together by space and hairlines, with a soft shade pool behind copy so
        white type still reads over the ambient ground.
        ========================================================================
      */}
      <section
        id="about"
        className="relative max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-24 border-t border-white/[0.07] z-10 scroll-mt-28"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="overflow-hidden aspect-[4/3]">
            <img
              src="/images/philosophy-sanctuary.jpg"
              alt="The Alexa Spa sanctuary interior"
              className="h-full w-full object-cover brightness-90 saturate-[0.85]"
            />
          </div>

          <div className="pool space-y-5">
            <span className="block text-xs font-mono tracking-[0.3em] text-[#d9bb8e] uppercase">
              About The Sanctuary
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase leading-tight text-shade-strong">
              A Quiet Room In A <span className="italic text-[#c5a880]">Loud City</span>
            </h2>
            <p className="text-base text-[#f0e9df]/90 font-sans leading-relaxed max-w-[52ch] text-shade">
              Alexa Spa was built around one idea: a treatment should end with you
              feeling looked after, not processed. Every guest gets a private
              en-suite room with its own hot shower — no shared halls, no rushed
              turnarounds, no upselling on the table.
            </p>
            <p className="text-base text-[#f0e9df]/90 font-sans leading-relaxed max-w-[52ch] text-shade">
              Our therapists are certified in anatomy and pressure calibration, and
              they read the body in front of them rather than running a script. Oils
              are cold-pressed and blended in-house; stones, linen and towels are
              sterilised after every single session.
            </p>

            <dl className="grid grid-cols-3 gap-4 pt-5 border-t border-white/[0.07]">
              {[
                { value: "500+", label: "Guests Served" },
                { value: "4.9★", label: "Google Rating" },
                { value: "7 Days", label: "Open Weekly" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="block text-xl sm:text-2xl font-serif text-[#c5a880]">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 block text-[11px] font-mono uppercase tracking-wider text-[#e8ded2]/60">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/*
        ========================================================================
        THE STANDARD — four hairline columns, no boxes
        ========================================================================
      */}
      <section
        id="hygiene"
        className="relative max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-24 border-t border-white/[0.07] z-10 scroll-mt-28"
      >
        <div className="pool pool-center text-center space-y-3 mb-14">
          <span className="text-xs font-mono tracking-[0.3em] text-[#d9bb8e] uppercase">
            Our Uncompromising Standard
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase text-shade-strong">
            The 100% Luxury <span className="italic text-[#c5a880]">Hygiene Guarantee</span>
          </h2>
          <p className="text-base text-[#f0e9df]/85 font-sans max-w-xl mx-auto leading-relaxed">
            Hospital-grade sterilisation protocols, applied to every single guest.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 lg:gap-0">
          {[
            {
              title: "Single-Use Kits",
              desc: "Fresh sterilized linen, disposable innerwear, and sanitized slippers provided for every single guest.",
            },
            {
              title: "Attached Showers",
              desc: "Every therapy suite features an in-room hot rain shower with luxury organic botanical wash.",
            },
            {
              title: "Certified Therapists",
              desc: "Practitioners trained in human anatomy, trigger point release, and pressure calibration.",
            },
            {
              title: "120°C Sterilised",
              desc: "Volcanic basalt stones and towels autoclaved and steam-sterilized after every session.",
            },
          ].map((item, idx) => (
            <div
              key={item.title}
              className={`space-y-3 lg:px-8 ${
                idx === 0 ? "lg:pl-0" : "lg:border-l lg:border-white/[0.07]"
              }`}
            >
              <h4 className="text-[13px] font-sans font-semibold uppercase tracking-[0.16em] text-[#d9bb8e]">
                {item.title}
              </h4>
              <p className="text-sm text-[#f0e9df]/85 font-sans leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/*
        ========================================================================
        VERIFIED GOOGLE REVIEWS — pull quotes, no bordered cards
        ========================================================================
      */}
      <section
        id="reviews"
        className="relative max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-24 border-t border-white/[0.07] z-10 scroll-mt-28"
      >
        <ReviewsWall testimonials={TESTIMONIALS} />
      </section>

      {/*
        ========================================================================
        VISIT & CONTACT — plain columns instead of one big bordered slab
        ========================================================================
      */}
      <section
        id="contact"
        className="relative max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-24 border-t border-white/[0.07] z-10 scroll-mt-28"
      >
        {/* Kept so the drawer's older #location link still lands here. */}
        <span id="location" aria-hidden className="block scroll-mt-28" />

        <div className="pool flex flex-col items-start gap-6 max-w-3xl">
          <span className="text-xs font-mono tracking-[0.3em] text-[#d9bb8e] uppercase">
            Visit &amp; Contact
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase leading-tight text-shade-strong">
            Tell Us When, And The Room Will Be{" "}
            <span className="italic text-[#c5a880]">Waiting</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenReservation()}
              className="px-8 py-3.5 rounded-full bg-[#c5a880] text-[#07090b] text-[13px] font-sans font-bold tracking-[0.14em] uppercase hover:brightness-110 shadow-lg shadow-[#c5a880]/20 transition-all cursor-pointer"
            >
              Book Appointment
            </button>
            <button
              onClick={() => window.open("https://maps.google.com", "_blank")}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/15 text-[13px] font-sans tracking-[0.14em] uppercase text-[#f7f4ee] hover:border-[#c5a880] hover:text-[#c5a880] transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              Google Maps
            </button>
          </div>
        </div>

        <dl className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 pt-10 border-t border-white/[0.07]">
          <div>
            <dt className="mb-2.5 text-xs font-mono uppercase tracking-[0.2em] text-[#e8ded2]/65">
              Location &amp; Valet
            </dt>
            <dd className="text-base text-[#f0e9df]/85 font-sans leading-relaxed">
              2nd Floor, Grand Commercial Plaza, Main Boulevard.
              <br />
              Complimentary valet parking at basement level.
            </dd>
          </div>
          <div>
            <dt className="mb-2.5 text-xs font-mono uppercase tracking-[0.2em] text-[#e8ded2]/65">
              Operating Hours
            </dt>
            <dd className="text-[15px] text-[#f0e9df]/85 font-mono leading-relaxed">
              Open 7 days · 10:00 AM — 10:00 PM
              <br />
              Last slot 09:15 PM · Happy hours Mon–Thu 11–4
            </dd>
          </div>
          <div>
            <dt className="mb-2.5 text-xs font-mono uppercase tracking-[0.2em] text-[#e8ded2]/65">
              Reach Us
            </dt>
            <dd className="text-base text-[#f0e9df]/85 font-sans leading-relaxed">
              <a
                href="tel:+919820012345"
                className="inline-flex items-center gap-1.5 font-mono text-[#c5a880] hover:text-[#f7f4ee] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                +91 98200 12345
              </a>
              <br />
              Confirmed on WhatsApp in minutes.
            </dd>
          </div>
        </dl>
      </section>

      {/*
        ========================================================================
        FOOTER
        ========================================================================
      */}
      {/*
        ========================================================================
        FOOTER
        Full-width dark band. A footer is the one place a solid ground is the
        convention rather than a compromise: it ends the page, carries the legal
        and contact detail, and has to stay readable no matter what the ambient
        canvas is doing behind it.
        ========================================================================
      */}
      <footer className="relative z-10 mt-16 border-t border-white/[0.09] bg-[#07090b]/92 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          {/* Top: the ask */}
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-white/[0.07] py-12">
            <div className="space-y-3">
              <span className="block font-mono text-[11px] uppercase tracking-[0.3em] text-[#c5a880]">
                Reservations
              </span>
              <h3 className="max-w-[18ch] font-serif text-2xl sm:text-3xl font-light leading-tight text-[#f7f4ee]">
                Tell us when, and the room will be waiting.
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onOpenReservation()}
                className="cursor-pointer rounded-full bg-[#c5a880] px-8 py-4 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#07090b] transition-all hover:brightness-110"
              >
                Book a slot
              </button>
              <a
                href="https://wa.me/919820012345"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/[0.14] px-8 py-4 font-sans text-[11px] uppercase tracking-[0.2em] text-[#f0e9df]/80 transition-all hover:border-[#c5a880] hover:text-[#c5a880]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Columns */}
          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div className="space-y-4">
              <span className="block font-serif text-2xl uppercase tracking-[0.26em] text-[#f7f4ee]">
                Alexa{" "}
                <span className="font-mono text-[11px] tracking-[0.3em] text-[#c5a880]">Spa</span>
              </span>
              <p className="max-w-[32ch] font-sans text-sm leading-relaxed text-[#f0e9df]/65">
                Ten treatments, one room at a time. Private en-suite therapy with an
                attached hot shower behind every door.
              </p>
              <div className="flex gap-3 pt-1">
                {[
                  { Icon: Instagram, label: "Instagram", href: "https://instagram.com" },
                  { Icon: Facebook, label: "Facebook", href: "https://facebook.com" },
                  { Icon: Star, label: "Google reviews", href: "https://maps.google.com" },
                ].map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] text-[#f0e9df]/65 transition-all hover:border-[#c5a880] hover:text-[#c5a880]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <span className="block font-mono text-[11px] uppercase tracking-[0.24em] text-[#c5a880]">
                Treatments
              </span>
              <ul className="space-y-2.5 font-sans text-sm text-[#f0e9df]/70">
                {[
                  "Deep Tissue & Volcanic Knot",
                  "Signature Balinese",
                  "24K Gold Facial",
                  "Royal Couple Suite",
                  "Thai Foot Reflexology",
                ].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => scrollToSection("rituals")}
                      className="cursor-pointer text-left transition-colors hover:text-[#c5a880]"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <span className="block font-mono text-[11px] uppercase tracking-[0.24em] text-[#c5a880]">
                Explore
              </span>
              <ul className="space-y-2.5 font-sans text-sm text-[#f0e9df]/70">
                {[
                  { label: "The sanctuary", target: "about" },
                  { label: "Hygiene standard", target: "hygiene" },
                  { label: "Guest reviews", target: "reviews" },
                  { label: "Couple suite", target: "couple-suite" },
                  { label: "Visit & contact", target: "contact" },
                ].map((item) => (
                  <li key={item.target}>
                    <button
                      onClick={() => scrollToSection(item.target)}
                      className="cursor-pointer text-left transition-colors hover:text-[#c5a880]"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <span className="block font-mono text-[11px] uppercase tracking-[0.24em] text-[#c5a880]">
                Visit
              </span>
              <address className="space-y-3 not-italic font-sans text-sm leading-relaxed text-[#f0e9df]/70">
                <span className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c5a880]" />
                  2nd Floor, Grand Commercial Plaza
                  <br />
                  Main Boulevard · valet parking
                </span>
                <span className="flex gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#c5a880]" />
                  10:00 — 22:00, seven days
                  <br />
                  Last slot 21:15
                </span>
                <a
                  href="tel:+919820012345"
                  className="flex items-center gap-2.5 font-mono text-[#c5a880] transition-colors hover:text-[#f7f4ee]"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  +91 98200 12345
                </a>
              </address>
            </div>
          </div>

          {/* Legal bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] py-7 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f0e9df]/45">
            <span>© 2026 Alexa Spa &amp; Wellness Center</span>
            <div className="flex flex-wrap items-center gap-7">
              <Link href="/admin" className="transition-colors hover:text-[#c5a880]">
                Owner Portal
              </Link>
              <a href="#" className="transition-colors hover:text-[#c5a880]">
                Privacy
              </a>
              <a href="#" className="transition-colors hover:text-[#c5a880]">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </WavyBackground>
  );
}
