"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface CoverflowSlide {
  id?: string;
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  price?: string;
  tag?: string;
  meta?: { label: string; value: string }[];
}

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  /** Degrees the first neighbour tilts. */
  rotate?: number;
  /** How far the first neighbour recedes, as a fraction of card width. */
  depth?: number;
  /** Viewer distance as a multiple of card width — smaller is a wider lens. */
  perspective?: number;
  /** Exponent on distance. Below 1 the rake eases off as cards travel out. */
  falloff?: number;
  /** Opacity lost per step from the centre. */
  fade?: number;
  /** Any CSS length. Everything else is derived from it, so the rake scales. */
  cardWidth?: string;
  /** Space between cards, as a fraction of card width. */
  gap?: number;
  loop?: boolean;
  /** Drifts continuously like a ticker; pauses on hover, focus, drag and
      off-screen. */
  autoplay?: boolean;
  /** Drift speed in cards per second. 0.25 ≈ four seconds a card. */
  cardsPerSecond?: number;
  showCaption?: boolean;
  showPagination?: boolean;
  showNavigation?: boolean;
  onSelectSlide?: (slide: CoverflowSlide, index: number) => void;
  onBookSlide?: (slideId?: string) => void;
  /** Secondary action on the caption dock — opens the full ritual protocol. */
  onDetailsSlide?: (slideId?: string) => void;
  /** Names the carousel for assistive tech. */
  label?: string;
  className?: string;
  cardClassName?: string;
}

export function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = "clamp(220px, 30vw, 360px)",
  gap = 0.08,
  loop = true,
  autoplay = false,
  cardsPerSecond = 0.25,
  showCaption = true,
  showPagination = true,
  showNavigation = true,
  onSelectSlide,
  onBookSlide,
  onDetailsSlide,
  label = "Cover carousel",
  className,
  cardClassName,
}: CoverflowCarouselProps) {
  const count = slides.length;

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  /** Fractional card index at the centre. The single source of truth. */
  const posRef = React.useRef(0);
  /** Where the current settle is headed. Stepping off `pos` instead would
      swallow a keypress that lands mid-flight, before the round-off moves. */
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
  } | null>(null);
  /** Set once a pointer travels far enough to count as a drag, so the gesture
      that ends it isn't also treated as a tap. */
  const draggedRef = React.useRef(false);
  /** Card index the press started on — taps are resolved from this. */
  const tapIndexRef = React.useRef<number | null>(null);
  /** True once a press has been handled, so the click fallback stands down. */
  const tapActedRef = React.useRef(false);
  /** Pointer resting on the deck — autoplay waits while someone is reading. */
  const hoveredRef = React.useRef(false);

  const [selected, setSelected] = React.useState(0);
  /** Mirrors `selected` for the drift loop, which runs outside React's render
      and would otherwise read a stale value every frame. */
  const selectedRef = React.useRef(0);

  React.useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  // Paint straight to the DOM. Sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Fold the distance into the shorter way round the ring. This is the
      // whole looping mechanism — no cloned nodes, no shuffling the DOM.
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      // Both the tilt and the recession ease off as cards travel out —
      // doubling the distance adds only about half again as much of each.
      // A linear ramp folds the second card shut; this keeps it readable.
      const ramp = Math.pow(distance, falloff);
      // Capped short of edge-on so a far card never turns its back.
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      // A card is teleported across the ring at exactly half a turn out, so it
      // has to be gone by then or the jump is visible.
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      const opacity = Math.max(0, 1 - fade * distance) * edge;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(100 - Math.round(distance));
      // A card faded to nothing still sits on top of the ring's far side and
      // would swallow the click meant for the visible card underneath.
      card.style.pointerEvents = opacity < 0.15 ? "none" : "auto";
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      const newIndex = indexAt(target);
      setSelected(newIndex);
      if (onSelectSlide) {
        onSelectSlide(slides[newIndex], newIndex);
      }

      const step = () => {
        const remaining = target - posRef.current;
        // 0.16 with a 0.0004 cutoff took ~45 frames (three quarters of a
        // second) to land, most of it crawling the last pixel. 0.3 with a
        // cutoff the eye can't resolve settles in about a third of that.
        if (Math.abs(remaining) < 0.003) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        posRef.current += remaining * 0.3;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, onSelectSlide, paint, slides],
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const goTo = React.useCallback(
    (index: number) => {
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = React.useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  );

  /** A side card comes to the centre; the centre card opens its details. */
  const activateCard = (index: number) => {
    tapActedRef.current = true;
    if (index === indexAt(posRef.current)) onDetailsSlide?.(slides[index]?.id);
    else goTo(index);
  };

  /** Fallback for the tap. Pointer capture (and 3D hit-testing) can retarget
      the click away from the card, so the position is resolved from the
      coordinates instead of from the event's target. Skipped when the pointer
      handlers already acted on this press. */
  const onFrameClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (draggedRef.current || tapActedRef.current) return;
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const card = (under as HTMLElement | null)?.closest?.("[data-cf-index]");
    if (!card) return;
    const index = Number(card.getAttribute("data-cf-index"));
    if (!Number.isNaN(index)) activateCard(index);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Remember which card the press landed on. The card's own onClick can't be
    // trusted: pointer capture below retargets the compatibility click to the
    // frame, so a handler on the card never fires.
    const hit = (event.target as HTMLElement | null)?.closest?.("[data-cf-index]");
    tapIndexRef.current = hit ? Number(hit.getAttribute("data-cf-index")) : null;

    // Capture is claimed only once a drag really starts (see onPointerMove).
    // Claiming it here retargeted the click to the frame, which is what broke
    // selecting a side card.
    targetRef.current = posRef.current;
    draggedRef.current = false;
    tapActedRef.current = false;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    if (!draggedRef.current && Math.abs(event.clientX - drag.x) > 6) {
      draggedRef.current = true;
      // Now that it's a drag, take the pointer so it can leave the frame.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!draggedRef.current) return; // a still finger shouldn't nudge the deck

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;

    const index = indexAt(posRef.current);
    if (index !== selected) {
      setSelected(index);
      if (onSelectSlide) onSelectSlide(slides[index], index);
    }
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;

    // A press that never travelled is a tap on a card, not a throw.
    const tapped = tapIndexRef.current;
    tapIndexRef.current = null;
    if (!draggedRef.current && tapped !== null && !Number.isNaN(tapped)) {
      activateCard(tapped);
      return;
    }

    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // A filtered list can shrink out from under the current position, leaving
  // `selected` past the end and the caption dock blank. Snap back to the top.
  React.useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    posRef.current = 0;
    targetRef.current = 0;
    setSelected(0);
    cardRefs.current.length = count;
    paint();
    // Deliberately keyed on the list size only — re-centring on every paint
    // identity change would fight the drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Autoplay drifts the ring continuously, the way a headline ticker runs —
  // no stepping from card to card. It's a plain rAF advance on the same `pos`
  // the drag uses, so a tap or an arrow interrupts it mid-glide with no
  // handover. Held (not merely skipped) while someone is reading it, touching
  // it, scrolled past it, or on another tab.
  React.useEffect(() => {
    if (!autoplay || count < 2) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const frame = frameRef.current;
    let raf: number | null = null;
    let last = performance.now();
    let onScreen = true;

    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, 0.05);
      last = now;

      const busy =
        hoveredRef.current ||
        dragRef.current !== null ||
        // A settle from a tap or an arrow owns `pos` until it lands.
        rafRef.current !== null ||
        document.hidden;

      if (!busy) {
        posRef.current += cardsPerSecond * elapsed;
        // Keep the number small; the ring is modular anyway.
        if (posRef.current >= count) posRef.current -= count;
        targetRef.current = posRef.current;
        paint();

        const index = indexAt(posRef.current);
        if (index !== selectedRef.current) {
          selectedRef.current = index;
          setSelected(index);
          if (onSelectSlide) onSelectSlide(slides[index], index);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf !== null) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (raf === null) return;
      cancelAnimationFrame(raf);
      raf = null;
    };

    start();

    const onVisibility = () => (document.hidden ? stop() : onScreen && start());
    document.addEventListener("visibilitychange", onVisibility);

    let observer: IntersectionObserver | null = null;
    if (frame) {
      observer = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          if (onScreen && !document.hidden) start();
          else stop();
        },
        { threshold: 0.15 }
      );
      observer.observe(frame);
    }

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, [autoplay, cardsPerSecond, count, indexAt, onSelectSlide, paint, slides]);

  const active = slides[selected];

  return (
    <div
      className={cn("w-full select-none", className)}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      // Whole region, not just the cards: reading the caption or reaching for
      // the book button should hold the deck too.
      onMouseEnter={() => (hoveredRef.current = true)}
      onMouseLeave={() => (hoveredRef.current = false)}
      onFocusCapture={() => (hoveredRef.current = true)}
      onBlurCapture={() => (hoveredRef.current = false)}
    >
      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={onFrameClick}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            }
          }}
          className="cursor-grab overflow-hidden py-5 sm:py-8 outline-none focus-visible:ring-1 focus-visible:ring-[#c5a880] active:cursor-grabbing"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none"
            style={{
              height: "calc(var(--cf-card) * 1.15)",
              transformStyle: "preserve-3d",
            }}
          >
            {slides.map((slide, index) => {
              const isCenter = index === selected;
              return (
                <div
                  key={index}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  // Taps are resolved in endDrag from this attribute — see the
                  // note in onPointerDown about pointer capture eating clicks.
                  data-cf-index={index}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${count}`}
                  className={cn(
                    // Only the border/shadow transition — `transition-all` also
                    // animated the transform we repaint every frame, so each
                    // move was chasing a 300ms tail.
                    "absolute left-1/2 top-0 rounded-3xl overflow-hidden shadow-2xl will-change-transform border transition-colors duration-200 cursor-pointer bg-[#0b0f12]",
                    isCenter
                      ? "border-[#c5a880] shadow-[0_20px_60px_-10px_rgba(197,168,128,0.3)]"
                      : "border-white/[0.08] hover:border-white/20",
                    cardClassName,
                  )}
                  style={{
                    width: "var(--cf-card)",
                    height: "calc(var(--cf-card) * 1.15)",
                  }}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/ritual-basalt.jpg";
                    }}
                    className="h-full w-full select-none object-cover brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] via-transparent to-[#07090b]/40 pointer-events-none" />

                  {/* Slide Floating Badges */}
                  {slide.tag && (
                    <div className="absolute top-3.5 left-3.5">
                      <span className="px-3 py-1 rounded-full bg-[#07090b]/85 backdrop-blur-md border border-[#c5a880]/40 text-[9px] font-mono tracking-widest text-[#c5a880] uppercase font-bold">
                        {slide.tag}
                      </span>
                    </div>
                  )}

                  {slide.price && (
                    <div className="absolute bottom-3.5 right-3.5">
                      <span className="px-3.5 py-1 rounded-full bg-[#c5a880] text-[#07090b] font-mono text-xs sm:text-sm font-bold shadow-lg">
                        {slide.price}
                      </span>
                    </div>
                  )}

                  {slide.title && (
                    <div className="absolute bottom-3.5 left-3.5 right-24 text-left space-y-1">
                      <h4 className="text-sm sm:text-base font-serif font-bold text-[#f7f4ee] line-clamp-1 drop-shadow-md">
                        {slide.title}
                      </h4>
                      {/* The centre card is clickable — say so, or nobody tries it. */}
                      {isCenter && onDetailsSlide && (
                        <span className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#c5a880]/90">
                          Tap for full details
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showNavigation && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => nudge(-1)}
              className="absolute left-2 sm:left-6 top-1/2 z-[200] -translate-y-1/2 rounded-full bg-[#07090b]/85 border border-[#c5a880]/40 p-3 text-[#c5a880] backdrop-blur-xl transition-all hover:bg-[#c5a880] hover:text-[#07090b] shadow-xl hover:scale-110 cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => nudge(1)}
              className="absolute right-2 sm:right-6 top-1/2 z-[200] -translate-y-1/2 rounded-full bg-[#07090b]/85 border border-[#c5a880]/40 p-3 text-[#c5a880] backdrop-blur-xl transition-all hover:bg-[#c5a880] hover:text-[#07090b] shadow-xl hover:scale-110 cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Active Caption & High-Conversion Action Dock */}
      {showCaption && active?.title && (
        <div
          key={selected}
          className="mt-4 flex flex-col items-center px-4 animate-fadeInFast text-center space-y-3 max-w-2xl mx-auto"
        >
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-serif font-light tracking-wide text-[#f7f4ee]">
              {active.title}
            </h3>
            {active.subtitle && (
              <p className="text-xs sm:text-sm text-[#e8ded2]/75 font-sans leading-relaxed">
                {active.subtitle}
              </p>
            )}
          </div>

          {/* The spec chips and the protocol button both lived here once. The
              chips now sit in the detail sheet's spec grid, and tapping the
              centre card is what opens that sheet — so the dock is down to the
              one thing it's for. */}
          {onBookSlide && (
            <div className="pt-3">
              <button
                onClick={() => onBookSlide(active.id)}
                className="group px-8 py-3.5 rounded-full bg-[#c5a880] text-[#07090b] text-xs font-sans font-bold tracking-widest uppercase hover:brightness-110 shadow-xl shadow-[#c5a880]/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Book this therapy</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          )}
        </div>
      )}

      {showPagination && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selected}
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                index === selected
                  ? "w-8 bg-[#c5a880]"
                  : "w-2 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
