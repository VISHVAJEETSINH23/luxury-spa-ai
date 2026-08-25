"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  therapy: string;
}

interface ReviewsWallProps {
  testimonials: Testimonial[];
}

/** Characters per second, roughly a fast confident typist. */
const CHARS_PER_SECOND = 46;
/** Gap between one card starting and the next. */
const STAGGER_MS = 700;

export default function ReviewsWall({ testimonials }: ReviewsWallProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  /** Milliseconds since typing began. Character counts are derived from this
      during render, so the ticker owns exactly one number and can't be reset
      by anything re-rendering underneath it. */
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || started) return;

    // Nobody should watch a review type itself out while it is off screen —
    // by the time they scroll to it the effect would already be over.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);

    // Belt and braces: if the observer never fires (it can be starved while a
    // smooth-scroll library is driving the page), fall back to measuring the
    // rect on scroll. Without this the quotes would sit permanently empty.
    const check = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
        setStarted(true);
        observer.disconnect();
        window.removeEventListener("scroll", check);
      }
    };

    window.addEventListener("scroll", check, { passive: true });
    check();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, [started]);

  // Longest quote plus its stagger decides when the ticker can stop.
  const runtimeMs =
    (Math.max(...testimonials.map((t) => t.quote.length)) / CHARS_PER_SECOND) * 1000 +
    (testimonials.length - 1) * STAGGER_MS +
    400;

  useEffect(() => {
    if (!started) return;

    // A plain interval over one counter. The previous version rebuilt an array
    // of per-card counts inside the loop and depended on the testimonials prop,
    // so any change to that identity restarted the clock and the text sat on
    // zero characters forever.
    const startedAt = performance.now();
    const id = window.setInterval(() => {
      const value = performance.now() - startedAt;
      setElapsed(value);
      if (value >= runtimeMs) window.clearInterval(id);
    }, 33);

    return () => window.clearInterval(id);
  }, [started, runtimeMs]);

  return (
    <div ref={sectionRef}>
      <div className="pool pool-center text-center space-y-2 mb-14">
        <div className="flex items-center justify-center gap-1 text-[#c5a880]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-[#c5a880]" />
          ))}
        </div>
        <h3 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase text-shade-strong">
          Loved By 500+ <span className="italic text-[#c5a880]">Discerning Guests</span>
        </h3>
        <p className="text-[11px] text-[#e8ded2]/65 font-mono tracking-wider uppercase">
          4.9 average on Google Reviews
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => {
          const own = elapsed - index * STAGGER_MS;
          const count =
            own <= 0
              ? 0
              : Math.min(
                  Math.floor((own / 1000) * CHARS_PER_SECOND),
                  testimonial.quote.length
                );
          const isTyping = started && count < testimonial.quote.length;

          return (
            <figure
              key={testimonial.name}
              className="group flex flex-col justify-between gap-6 rounded-2xl border border-white/[0.09] bg-[#0b0f12]/55 backdrop-blur-xl p-7 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] transition-all duration-500 hover:border-[#c5a880]/35 hover:-translate-y-1"
            >
              {/* The full quote is rendered underneath at zero opacity so the
                  card is its final height from the first frame — otherwise
                  three cards would grow as they typed and shove the page. */}
              <blockquote className="relative">
                <span aria-hidden className="invisible block text-base sm:text-lg font-serif font-light italic leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </span>

                <p className="absolute inset-0 text-base sm:text-lg font-serif font-light italic leading-relaxed text-[#f7f4ee]">
                  &ldquo;{testimonial.quote.slice(0, count)}
                  {isTyping ? (
                    <span
                      aria-hidden
                      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-[#c5a880] animate-pulse"
                    />
                  ) : (
                    "”"
                  )}
                </p>
              </blockquote>

              <figcaption className="pt-4 border-t border-white/[0.09] space-y-1">
                <span className="block text-[12px] font-mono font-medium tracking-[0.16em] uppercase text-[#c5a880]">
                  {testimonial.name}
                </span>
                <span className="block text-[11px] font-mono text-[#e8ded2]/55">
                  {testimonial.therapy}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
