"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const TOTAL_FRAMES = 840;
const DURATION_SECONDS = 70;

interface ChapterData {
  id: string;
  actNumber: string;
  tagline: string;
  titlePrimary: string;
  titleItalic: string;
  description: string;
  alignment: "left" | "right" | "center";
  startProgress: number;
  peakProgress: number;
  endProgress: number;
}

const CHAPTERS: ChapterData[] = [
  {
    id: "chapter-1",
    actNumber: "WELCOME",
    tagline: "LUXURY DAY SPA & WELLNESS",
    titlePrimary: "Relax your body &",
    titleItalic: "de-stress your mind.",
    description:
      "Welcome to Alexa Spa. Step into peaceful private suites with warm aromatherapy oils, soothing music, and authentic full-body massages.",
    alignment: "left",
    startProgress: 0.08,
    peakProgress: 0.18,
    endProgress: 0.28,
  },
  {
    id: "chapter-2",
    actNumber: "PAIN RELIEF",
    tagline: "EXPERT THERAPEUTIC MASSAGES",
    titlePrimary: "Relieve desk neck pain &",
    titleItalic: "lower back stiffness.",
    description:
      "Targeted Deep Tissue and Heated Volcanic Basalt therapy performed by certified master therapists to unbind stubborn muscle knots.",
    alignment: "right",
    startProgress: 0.32,
    peakProgress: 0.43,
    endProgress: 0.54,
  },
  {
    id: "chapter-3",
    actNumber: "100% HYGIENE",
    tagline: "PRIVATE ATTACHED SHOWER SUITES",
    titlePrimary: "Private en-suite rooms &",
    titleItalic: "sterilized single-use kits.",
    description:
      "Every guest receives fresh sanitized linen, disposable spa innerwear, and a private attached hot rain shower with organic botanical wash.",
    alignment: "left",
    startProgress: 0.58,
    peakProgress: 0.68,
    endProgress: 0.79,
  },
  {
    id: "chapter-4",
    actNumber: "BOOK TODAY",
    tagline: "INSTANT APPOINTMENT BOOKING",
    titlePrimary: "Book your relaxation slot in",
    titleItalic: "10 seconds.",
    description:
      "Open 7 days a week (10 AM - 10 PM). Enjoy Flat 20% Off on your first visit with Code: FIRST20.",
    alignment: "center",
    startProgress: 0.83,
    peakProgress: 0.94,
    endProgress: 1.0,
  },
];

interface CinematicHeroProps {
  onOpenMenu?: () => void;
  onOpenReservation?: () => void;
  onProgressUpdate?: (progress: number) => void;
}

export default function CinematicHero({
  onOpenMenu,
  onOpenReservation,
  onProgressUpdate,
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);
  const introOverlayRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [currentChapterTitle, setCurrentChapterTitle] = useState<string>("THE THRESHOLD");
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Cache for preloaded HTMLImageElements
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const lenisRef = useRef<Lenis | null>(null);

  // High-precision sub-frame physics interpolation state
  const physicsRef = useRef({
    targetFrame: 0,
    currentFrame: 0,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
  });

  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getFramePath = (index: number) => {
    const frameNum = (index + 1).toString().padStart(4, "0");
    return `/frames/frame_${frameNum}.jpg?v=6`;
  };

  // Programmatic in-memory audio initialization (prevents browser PiP / media hover overlay)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/audio/alexa-soundtrack.mp3");
      audio.loop = true;
      audio.preload = "auto";
      audioInstanceRef.current = audio;
    }

    return () => {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        audioInstanceRef.current = null;
      }
    };
  }, []);

  // Toggle ambient sanctuary soundtrack
  const handleToggleSound = () => {
    const audio = audioInstanceRef.current;
    if (!audio) return;

    if (isAudioActive) {
      audio.pause();
      setIsAudioActive(false);
    } else {
      audio.volume = 1.0;
      audio.currentTime = currentProgress * DURATION_SECONDS;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsAudioActive(true);
          })
          .catch((err) => {
            console.error("Audio playback error:", err);
          });
      }
    }
  };

  // Ultra-Smooth Sub-Frame Blender: Cross-dissolves between Frame N and Frame N+1
  const renderSmoothFrame = useCallback((exactFloatFrame: number, mouseOffsetX: number, mouseOffsetY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const clampedFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, exactFloatFrame));
    const floorIndex = Math.floor(clampedFrame);
    const ceilIndex = Math.min(TOTAL_FRAMES - 1, floorIndex + 1);
    const blendAlpha = clampedFrame - floorIndex;

    const imgFloor = imagesRef.current[floorIndex];
    const imgCeil = imagesRef.current[ceilIndex];

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Draw primary base frame
    if (imgFloor && imgFloor.complete && imgFloor.naturalWidth > 0) {
      drawScaledImage(ctx, w, h, imgFloor, 1, mouseOffsetX, mouseOffsetY);
    }

    // Blend next frame with sub-frame alpha if in between frames (creates liquid 60fps/120fps motion)
    if (blendAlpha > 0.01 && imgCeil && imgCeil.complete && imgCeil.naturalWidth > 0) {
      drawScaledImage(ctx, w, h, imgCeil, blendAlpha, mouseOffsetX, mouseOffsetY);
    }
  }, []);

  const drawScaledImage = (
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    img: HTMLImageElement,
    alpha: number,
    offsetXModifier: number,
    offsetYModifier: number
  ) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasW / canvasH;

    let renderWidth = canvasW;
    let renderHeight = canvasH;
    let offsetX = 0;
    let offsetY = 0;

    const scaleOverscan = 1.04;

    if (canvasRatio > imgRatio) {
      renderHeight = (canvasW / imgRatio) * scaleOverscan;
      renderWidth = canvasW * scaleOverscan;
      offsetY = (canvasH - renderHeight) / 2 + offsetYModifier;
      offsetX = (canvasW - renderWidth) / 2 + offsetXModifier;
    } else {
      renderWidth = canvasH * imgRatio * scaleOverscan;
      renderHeight = canvasH * scaleOverscan;
      offsetX = (canvasW - renderWidth) / 2 + offsetXModifier;
      offsetY = (canvasH - renderHeight) / 2 + offsetYModifier;
    }

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
    ctx.globalAlpha = 1.0;
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    renderSmoothFrame(physicsRef.current.currentFrame, 0, 0);
  }, [renderSmoothFrame]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let isMounted = true;
    let rafId: number;
    window.addEventListener("resize", resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      physicsRef.current.targetMouseX = -normX * 12;
      physicsRef.current.targetMouseY = -normY * 8;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const criticalFrames = Math.min(50, TOTAL_FRAMES);
    let loadedCount = 0;

    const loadSingleImage = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (imagesRef.current[index]) {
          resolve(imagesRef.current[index]!);
          return;
        }
        const img = new Image();
        img.src = getFramePath(index);
        img.onload = () => {
          if (isMounted) {
            imagesRef.current[index] = img;
          }
          resolve(img);
        };
        img.onerror = () => {
          resolve(img);
        };
      });
    };

    const criticalPromises = [];
    for (let i = 0; i < criticalFrames; i++) {
      criticalPromises.push(
        loadSingleImage(i).then(() => {
          loadedCount++;
          if (isMounted) {
            setLoadProgress(Math.round((loadedCount / criticalFrames) * 100));
          }
        })
      );
    }

    Promise.all(criticalPromises).then(() => {
      if (!isMounted) return;

      resizeCanvas();
      renderSmoothFrame(0, 0, 0);

      setTimeout(() => {
        if (isMounted) setIsLoading(false);
      }, 300);

      const lenis = new Lenis({
        duration: 2.0,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.75,
        touchMultiplier: 1.2,
      });
      lenisRef.current = lenis;
      // Published so nav links and the drawer can scroll through Lenis instead
      // of fighting it with a native jump. See lib/scroll.ts.
      window.__lenis = lenis;

      lenis.on("scroll", ScrollTrigger.update);

      const updateTicker = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(updateTicker);
      gsap.ticker.lagSmoothing(0);

      const liquidLoop = () => {
        const p = physicsRef.current;
        const frameDelta = p.targetFrame - p.currentFrame;
        p.currentFrame += frameDelta * 0.09;

        p.mouseX += (p.targetMouseX - p.mouseX) * 0.05;
        p.mouseY += (p.targetMouseY - p.mouseY) * 0.05;

        renderSmoothFrame(p.currentFrame, p.mouseX, p.mouseY);
        rafId = requestAnimationFrame(liquidLoop);
      };
      rafId = requestAnimationFrame(liquidLoop);

      const st = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=800%",
        pin: viewportRef.current,
        pinSpacing: true,
        scrub: 1.0,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const targetFrame = Math.min(TOTAL_FRAMES - 1, progress * (TOTAL_FRAMES - 1));

          physicsRef.current.targetFrame = targetFrame;
          setCurrentProgress(progress);
          if (onProgressUpdate) {
            onProgressUpdate(progress);
          }

          if (audioInstanceRef.current && !audioInstanceRef.current.paused) {
            const targetAudioTime = progress * DURATION_SECONDS;
            if (Math.abs(audioInstanceRef.current.currentTime - targetAudioTime) > 3.0) {
              audioInstanceRef.current.currentTime = targetAudioTime;
            }
          }

          if (introOverlayRef.current) {
            const introOpacity = Math.max(0, 1 - progress * 14);
            const introY = -progress * 80;
            const introScale = 1 - progress * 0.08;
            gsap.set(introOverlayRef.current, {
              opacity: introOpacity,
              y: introY,
              scale: introScale,
              pointerEvents: introOpacity > 0.1 ? "auto" : "none",
            });
          }

          if (scrollIndicatorRef.current) {
            const scrollOpacity = Math.max(0, 1 - progress * 18);
            gsap.set(scrollIndicatorRef.current, {
              opacity: scrollOpacity,
              pointerEvents: "none",
            });
          }

          CHAPTERS.forEach((ch, idx) => {
            const el = chapterRefs.current[idx];
            if (!el) return;

            let opacity = 0;
            let translateY = 25;
            let scale = 0.98;

            if (progress >= ch.startProgress && progress <= ch.endProgress) {
              if (progress < ch.peakProgress) {
                const t = (progress - ch.startProgress) / (ch.peakProgress - ch.startProgress);
                opacity = gsap.parseEase("power2.out")(t);
                translateY = (1 - t) * 25;
                scale = 0.98 + t * 0.02;
              } else {
                const t = (progress - ch.peakProgress) / (ch.endProgress - ch.peakProgress);
                opacity = 1 - gsap.parseEase("power2.in")(t);
                translateY = -t * 20;
                scale = 1 - t * 0.02;
              }

              setActiveChapterIndex(idx);
              setCurrentChapterTitle(ch.tagline);
            }

            gsap.set(el, {
              opacity: Math.max(0, Math.min(1, opacity)),
              y: translateY,
              scale: scale,
              pointerEvents: opacity > 0.4 ? "auto" : "none",
            });
          });
        },
      });

      ScrollTrigger.refresh();

      let nextIndex = criticalFrames;
      const CHUNK_SIZE = 35;

      const loadNextChunk = () => {
        if (!isMounted || nextIndex >= TOTAL_FRAMES) return;

        const promises = [];
        const end = Math.min(nextIndex + CHUNK_SIZE, TOTAL_FRAMES);
        for (let i = nextIndex; i < end; i++) {
          promises.push(loadSingleImage(i));
        }

        Promise.all(promises).then(() => {
          nextIndex = end;
          if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            (window as any).requestIdleCallback(loadNextChunk);
          } else {
            setTimeout(loadNextChunk, 25);
          }
        });
      };

      loadNextChunk();
    });

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (audioInstanceRef.current) audioInstanceRef.current.pause();
      if (lenisRef.current) lenisRef.current.destroy();
      if (typeof window !== "undefined") delete window.__lenis;
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [renderSmoothFrame, resizeCanvas, onProgressUpdate]);

  return (
    <div
      ref={containerRef}
      id="hero"
      className="relative w-full bg-[#07090b] text-[#f7f4ee] selection:bg-[#c5a880]/30 selection:text-[#f7f4ee]"
    >
      {/* 
        ========================================================================
        LUXURY ATMOSPHERIC LOADING SCREEN
        ========================================================================
      */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090b] transition-opacity duration-700 pointer-events-none ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col items-center space-y-6 text-center px-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl tracking-[0.32em] uppercase font-serif text-[#f7f4ee] font-light">
              ALEXA SPA
            </h1>
            <p className="text-[10px] sm:text-xs tracking-[0.45em] uppercase text-[#c5a880] font-sans font-medium">
              PREPARING YOUR ESCAPE
            </p>
          </div>

          <div className="w-40 h-[1.5px] bg-[#1a232b] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#9b805d] via-[#c5a880] to-[#e4d3ba] transition-all duration-200 ease-out"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        CINEMATIC VIEWPORT (100vw × 100vh) - PINNED RETINA CANVAS + PARALLAX
        ========================================================================
      */}
      <div
        ref={viewportRef}
        className="relative w-screen h-screen overflow-hidden bg-[#07090b] flex items-center justify-center select-none"
      >
        {/* Liquid Sub-Frame Interpolated Retina Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none block"
          id="alexa-cinematic-canvas"
        />

        {/* Ambient Vignette Overlay for High-Contrast Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090b]/80 via-transparent to-[#07090b]/50 pointer-events-none" />

        {/* Reading scrim. The frames run from near-black to bright steam, so
            text set over them held on some frames and vanished on others. This
            keeps a constant floor of contrast under the copy without flattening
            the footage — the bright areas still read as bright. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(7,9,11,0.72) 0%, rgba(7,9,11,0.34) 42%, rgba(7,9,11,0.2) 62%, rgba(7,9,11,0.72) 100%)," +
              "radial-gradient(120% 90% at 50% 50%, transparent 30%, rgba(7,9,11,0.55) 100%)",
          }}
        />

        {/* 
          ======================================================================
          BOTTOM HUD: CHAPTER TICKER & LOCATION COORDINATES
          ======================================================================
        */}
        <div className="absolute bottom-8 left-8 sm:bottom-10 sm:left-12 z-40 pointer-events-none flex items-center gap-4 text-xs">
          <span className="text-[11px] sm:text-xs font-mono tracking-widest text-[#d9bb8e] text-shade">
            {CHAPTERS[activeChapterIndex]?.actNumber || "ACT I"}
          </span>
          <span className="w-6 h-[1px] bg-[#c5a880]/30 hidden sm:inline-block" />
          <span className="text-[11px] sm:text-xs font-sans tracking-[0.25em] uppercase text-[#f7f4ee]/85 hidden sm:inline-block text-shade">
            {currentChapterTitle}
          </span>
        </div>

        <div className="absolute bottom-8 right-8 sm:bottom-10 sm:right-12 z-40 pointer-events-none text-[10px] font-mono text-[#c5a880]/60 tracking-wider hidden sm:block">
          SANCTUARY • ELEVATION 1,280M
        </div>

        {/* 
          ======================================================================
          RIGHT PROGRESS TRACKER
          ======================================================================
        */}
        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center gap-2">
          <div className="w-[1.5px] h-28 bg-white/10 rounded-full overflow-hidden relative backdrop-blur-sm">
            <div
              className="w-full bg-[#c5a880] transition-all duration-75 rounded-full"
              style={{ height: `${Math.round(currentProgress * 100)}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-[#c5a880]/80">
            {Math.round(currentProgress * 100)}%
          </span>
        </div>

        {/* 
          ======================================================================
          INITIAL HERO OVERLAY (Centered Haute-Couture Monograph)
          ======================================================================
        */}
        <div
          ref={introOverlayRef}
          className="relative z-20 flex flex-col items-center justify-center text-center px-6 max-w-4xl space-y-6"
        >
          <div className="flex items-center gap-4">
            <span className="w-8 h-px bg-[#c5a880]/50" />
            <span className="text-xs sm:text-sm tracking-[0.42em] uppercase text-[#d9bb8e] font-mono text-shade-strong">
              Private en-suite therapy
            </span>
            <span className="w-8 h-px bg-[#c5a880]/50" />
          </div>

          <h1 className="text-7xl sm:text-9xl md:text-[11rem] font-serif font-extralight tracking-[0.22em] text-[#f7f4ee] uppercase leading-[0.9] text-shade-strong">
            Alexa
          </h1>

          <p className="text-xl sm:text-3xl md:text-4xl font-serif italic font-light text-[#f0e9df] tracking-wide max-w-3xl text-shade-strong">
            Stillness, kept <span className="text-[#c5a880]">ready</span> for you.
          </p>
        </div>

        {/* 
          ======================================================================
          SYNCHRONIZED CHAPTER NARRATIVE OVERLAYS (Editorial Luxury Style)
          ======================================================================
        */}
        {CHAPTERS.map((ch, idx) => (
          <div
            key={ch.id}
            ref={(el) => {
              chapterRefs.current[idx] = el;
            }}
            className={`absolute inset-0 z-30 flex items-center p-6 sm:p-14 md:p-24 opacity-0 pointer-events-none ${
              ch.alignment === "left"
                ? "justify-start text-left"
                : ch.alignment === "right"
                ? "justify-end text-right"
                : "justify-center text-center"
            }`}
          >
            <div
              className={`max-w-xl space-y-4 ${
                ch.alignment === "right" ? "ml-auto" : ch.alignment === "center" ? "mx-auto" : "mr-auto"
              }`}
            >
              {/* Act Tag */}
              <div
                className={`flex items-center gap-3 ${
                  ch.alignment === "right"
                    ? "justify-end"
                    : ch.alignment === "center"
                    ? "justify-center"
                    : "justify-start"
                }`}
              >
                <span className="text-xs sm:text-sm font-mono text-[#d9bb8e] tracking-[0.3em] uppercase text-shade">
                  {ch.actNumber}
                </span>
                <span className="w-4 h-[1px] bg-[#c5a880]/50" />
                <span className="text-[11px] sm:text-xs tracking-[0.32em] text-[#e4d3ba] uppercase font-sans font-light text-shade">
                  {ch.tagline}
                </span>
              </div>

              {/* Headline with Italic Luxury Contrast */}
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif font-light tracking-[0.02em] text-[#f7f4ee] leading-[1.08] text-balance text-shade-strong">
                <span>{ch.titlePrimary} </span>
                <span className="italic font-light text-[#c5a880]">{ch.titleItalic}</span>
              </h2>

              {/* Description Body */}
              <p className="text-base sm:text-lg font-light text-[#f0e9df]/95 leading-[1.75] font-sans max-w-[48ch] text-shade-strong">
                {ch.description}
              </p>

              {/* Special CTA on the final chapter */}
              {idx === CHAPTERS.length - 1 && (
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={onOpenReservation}
                    className="px-9 py-4 rounded-full bg-[#c5a880] text-[#07090b] font-sans text-[13px] tracking-[0.15em] font-bold uppercase hover:brightness-110 shadow-xl hover:shadow-[#c5a880]/30 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Book an appointment</span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => {
                      const el = document.getElementById("rituals");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="px-8 py-4 rounded-full bg-[#0b0f12]/70 backdrop-blur-md border border-white/[0.14] text-[#e4d3ba] font-sans text-xs tracking-[0.15em] uppercase hover:bg-white/10 hover:border-[#c5a880] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>VIEW SERVICES & PRICES</span>
                    <span className="text-xs font-bold animate-bounce">↓</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 
          ======================================================================
          SCROLL INDICATOR
          ======================================================================
        */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 sm:bottom-10 inset-x-0 z-30 flex flex-col items-center justify-center pointer-events-none select-none space-y-3"
        >
          <span className="text-[9px] sm:text-[10px] tracking-[0.45em] uppercase text-[#c5a880]/90 font-mono font-light">
            SCROLL TO EXPLORE
          </span>

          <div className="w-5 h-9 rounded-full border border-[#c5a880]/40 p-1 flex justify-center backdrop-blur-sm bg-[#0b0f12]/30">
            <div className="w-1 h-2 rounded-full bg-[#c5a880] animate-scroll-pill" />
          </div>
        </div>
      </div>
    </div>
  );
}
