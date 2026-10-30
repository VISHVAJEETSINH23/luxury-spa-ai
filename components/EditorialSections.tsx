"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ServicesMenu from "@/components/ServicesMenu";
import BodyPainMapper from "@/components/BodyPainMapper";
import WavyBackground from "@/components/ui/blue-meshy-background";
import { MapPin, Phone, Clock, MessageCircle, Navigation, Star } from "lucide-react";
import { scrollToSection } from "@/lib/scroll";
import { BRAND, BRANCHES, BRANCH_LIST, branchHours, type BranchId } from "@/lib/branches";
import { BRANCH_PHOTOS, GUEST_REVIEWS } from "@/lib/guestContent";
import { COMPLETE_SPA_DATA } from "@/lib/treatments";
import { setSelectedBranch, useSelectedBranch } from "@/lib/selectedBranch";
import Image from "next/image";

interface EditorialSectionsProps {
  onOpenReservation: (experienceId?: string, minutes?: number) => void;
  onOpenAIDoctor?: () => void;
}

/** "9876543210" → "+91 98765 43210" */
function prettyPhone(digits: string): string {
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

const HOURS = `Open 7 days · ${BRANCH_LIST.map((b) => `${b.city} ${branchHours(b.id)}`).join(" · ")}`;

export default function EditorialSections({ onOpenReservation, onOpenAIDoctor }: EditorialSectionsProps) {
  const selectedBranch = useSelectedBranch();
  const [galleryBranch, setGalleryBranch] = useState<BranchId>("sangli");
  useEffect(() => {
    if (selectedBranch) setGalleryBranch(selectedBranch);
  }, [selectedBranch]);

  return (
    <WavyBackground className="relative w-full bg-[#07090b] text-[#f7f4ee] select-none z-20">
      {/* Short fades that join this panel to the hero above and the page below. */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#07090b] to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07090b] to-transparent pointer-events-none z-0" />

      {/* Menu & prices */}
      <section id="rituals" className="relative z-10 pt-8 scroll-mt-24">
        <ServicesMenu onOpenReservation={onOpenReservation} onOpenAIDoctor={onOpenAIDoctor} />
      </section>

      {/* "Where does it hurt?" */}
      <section className="relative z-10 pt-12 px-5 sm:px-8 lg:px-12">
        <BodyPainMapper onSelectTherapy={(therapyId, minutes) => onOpenReservation(therapyId, minutes)} />
      </section>

      {/* About */}
      <section
        id="about"
        className="relative max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-24 border-t border-white/[0.07] z-10 scroll-mt-28"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="relative overflow-hidden aspect-[4/3]">
            <Image
              src="/images/philosophy-sanctuary.jpg"
              alt="A treatment room at Alexa Salon & Spa"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover brightness-90 saturate-[0.85]"
            />
          </div>

          <div className="pool space-y-5">
            <span className="block text-xs font-mono tracking-[0.3em] text-[#d9bb8e] uppercase">About Alexa Salon & Spa</span>
            <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase leading-tight text-shade-strong">
              Two Branches, <span className="italic text-[#c5a880]">One Standard</span>
            </h2>
            <p className="text-base text-[#f0e9df]/90 font-sans leading-relaxed max-w-[52ch] text-shade">
              Alexa Salon & Spa has two branches — Sangli and Karad — with the same menu and the same prices at both.
              Massages for one, massages for two, a four-hand massage and a body scrub.
            </p>
            <p className="text-base text-[#f0e9df]/90 font-sans leading-relaxed max-w-[52ch] text-shade">
              Every guest gets a private room with an attached hot shower and fresh linen. Book online in under a
              minute, then pay online or at the spa — whichever you prefer.
            </p>
          </div>
        </div>
      </section>

      {/* Inside the spa */}
      <section
        id="gallery"
        className="relative max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-24 border-t border-white/[0.07] z-10 scroll-mt-28"
      >
        <div className="pool flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-5 max-w-3xl">
            <span className="block text-xs font-mono tracking-[0.3em] text-[#d9bb8e] uppercase">Inside the Spa</span>
            <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase leading-tight text-shade-strong">
              {BRANCHES[galleryBranch].city} <span className="italic text-[#c5a880]">Branch</span>
            </h2>
          </div>
          <div role="tablist" aria-label="Choose a branch" className="flex gap-2">
            {BRANCH_LIST.map((branch) => (
              <button
                key={branch.id}
                role="tab"
                aria-selected={galleryBranch === branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={`cursor-pointer rounded-full border px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  galleryBranch === branch.id
                    ? "border-[#c5a880] bg-[#c5a880] text-[#07090b]"
                    : "border-white/15 text-[#f0e9df]/75 hover:border-[#c5a880] hover:text-[#c5a880]"
                }`}
              >
                {branch.city}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 [&>*]:mb-3 sm:[&>*]:mb-4">
          {BRANCH_PHOTOS[galleryBranch].map((photo) => (
            <div
              key={photo.src}
              className={`relative break-inside-avoid overflow-hidden rounded-sm border border-white/[0.07] ${
                photo.tall ? "aspect-[3/5]" : "aspect-[4/3]"
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover brightness-90 saturate-[0.9] transition-transform duration-700 hover:scale-[1.04]"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Guest reviews */}
      <section
        id="reviews"
        className="relative max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-24 border-t border-white/[0.07] z-10 scroll-mt-28"
      >
        <div className="pool flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-5 max-w-3xl">
            <span className="block text-xs font-mono tracking-[0.3em] text-[#d9bb8e] uppercase">Guest Reviews</span>
            <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase leading-tight text-shade-strong">
              In Their <span className="italic text-[#c5a880]">Words</span>
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {BRANCH_LIST.map(
              (branch) =>
                branch.rating && (
                  <a
                    key={branch.id}
                    href={branch.rating.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-sm text-[#f0e9df]/85 hover:text-[#c5a880] transition-colors"
                  >
                    <Star className="h-4 w-4 fill-[#c5a880] text-[#c5a880]" />
                    {branch.city}: {branch.rating.score.toFixed(1)} · {branch.rating.count} ratings on {branch.rating.source}
                  </a>
                ),
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUEST_REVIEWS.map((review) => (
            <figure
              key={review.name}
              className="flex flex-col justify-between gap-6 border border-white/[0.08] bg-[#07090b]/60 backdrop-blur-sm p-6 sm:p-7"
            >
              <blockquote className="font-serif text-lg leading-relaxed text-[#f0e9df]/90">“{review.text}”</blockquote>
              <figcaption className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em]">
                <span className="text-[#c5a880]">{review.name}</span>
                <span className="text-[#f0e9df]/50">
                  {BRANCHES[review.branch].city} · {review.date}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Branches & contact */}
      <section
        id="contact"
        className="relative max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-24 border-t border-white/[0.07] z-10 scroll-mt-28"
      >
        {/* Kept so older #location links still land here. */}
        <span id="location" aria-hidden className="block scroll-mt-28" />

        <div className="pool flex flex-col items-start gap-6 max-w-3xl">
          <span className="text-xs font-mono tracking-[0.3em] text-[#d9bb8e] uppercase">Our Branches</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase leading-tight text-shade-strong">
            Sangli <span className="italic text-[#c5a880]">&amp;</span> Karad
          </h2>
          <button
            onClick={() => onOpenReservation()}
            className="px-8 py-3.5 rounded-full bg-[#c5a880] text-[#07090b] text-[13px] font-sans font-bold tracking-[0.14em] uppercase hover:brightness-110 shadow-lg shadow-[#c5a880]/20 transition-all cursor-pointer"
          >
            Book Appointment
          </button>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/[0.07]">
          {BRANCH_LIST.map((branch) => (
            <div key={branch.id} className="space-y-3">
              <h3 className="font-serif text-2xl text-[#f7f4ee]">{branch.name}</h3>
              <p className="flex gap-2.5 text-base text-[#f0e9df]/85 font-sans leading-relaxed">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#c5a880]" />
                {branch.address ?? branch.city}
              </p>
              <p className="flex gap-2.5 text-[15px] text-[#f0e9df]/85 font-mono">
                <Clock className="mt-1 h-4 w-4 shrink-0 text-[#c5a880]" />
                Open 7 days · {branchHours(branch.id)}
              </p>
              {(branch.rating || branch.since) && (
                <p className="flex gap-2.5 text-[15px] text-[#f0e9df]/85 font-mono">
                  <Star className="mt-1 h-4 w-4 shrink-0 text-[#c5a880]" />
                  {[
                    branch.rating && `${branch.rating.score.toFixed(1)} (${branch.rating.count} ratings, ${branch.rating.source})`,
                    branch.since && `Since ${branch.since}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {(branch.phone || branch.whatsapp || branch.mapsUrl) && (
                <div className="flex flex-wrap gap-4 pt-1">
                  {branch.phone && (
                    <a
                      href={`tel:+91${branch.phone}`}
                      className="inline-flex items-center gap-1.5 font-mono text-[#c5a880] hover:text-[#f7f4ee] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {prettyPhone(branch.phone)}
                    </a>
                  )}
                  {branch.whatsapp && (
                    <a
                      href={`https://wa.me/91${branch.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[#c5a880] hover:text-[#f7f4ee] transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                  {branch.mapsUrl && (
                    <a
                      href={branch.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[#c5a880] hover:text-[#f7f4ee] transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Get directions
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mt-16 border-t border-white/[0.09] bg-[#07090b]/92 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-white/[0.07] py-12">
            <div className="space-y-3">
              <span className="block font-mono text-[11px] uppercase tracking-[0.3em] text-[#c5a880]">Reservations</span>
              <h3 className="max-w-[18ch] font-serif text-2xl sm:text-3xl font-light leading-tight text-[#f7f4ee]">
                Pick a branch, pick a time — the room will be ready.
              </h3>
            </div>
            <button
              onClick={() => onOpenReservation()}
              className="cursor-pointer rounded-full bg-[#c5a880] px-8 py-4 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#07090b] transition-all hover:brightness-110"
            >
              Book a slot
            </button>
          </div>

          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-14 rounded-full" />
                <div>
                  <span className="block font-serif text-xl text-[#f7f4ee]">{BRAND.fullName}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#c5a880]">{BRAND.tagline}</span>
                </div>
              </div>
              <p className="max-w-[32ch] font-sans text-sm leading-relaxed text-[#f0e9df]/65">
                {HOURS}.
              </p>
            </div>

            <div className="space-y-4">
              <span className="block font-mono text-[11px] uppercase tracking-[0.24em] text-[#c5a880]">Treatments</span>
              <ul className="space-y-2.5 font-sans text-sm text-[#f0e9df]/70">
                {COMPLETE_SPA_DATA.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onOpenReservation(item.id)}
                      className="cursor-pointer text-left transition-colors hover:text-[#c5a880]"
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <span className="block font-mono text-[11px] uppercase tracking-[0.24em] text-[#c5a880]">Explore</span>
              <ul className="space-y-2.5 font-sans text-sm text-[#f0e9df]/70">
                {[
                  { label: "Menu & prices", target: "rituals" },
                  { label: "About", target: "about" },
                  { label: "Gallery", target: "gallery" },
                  { label: "Reviews", target: "reviews" },
                  { label: "Branches & contact", target: "contact" },
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
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] py-7 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f0e9df]/45">
            <span>© {new Date().getFullYear()} {BRAND.fullName}</span>
            <div className="flex flex-wrap items-center gap-7">
              <Link href="/booking" className="transition-colors hover:text-[#c5a880]">
                Manage booking
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-[#c5a880]">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-[#c5a880]">
                Terms
              </Link>
              <Link href="/refund-policy" className="transition-colors hover:text-[#c5a880]">
                Cancellation &amp; refunds
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </WavyBackground>
  );
}
