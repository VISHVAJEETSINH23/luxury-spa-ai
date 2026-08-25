"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function LuxuryCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const [cursorText, setCursorText] = useState<string>("");
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const mousePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only run on desktop devices with pointer
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (!isVisible) setIsVisible(true);

      // Instant dot tracking
      if (cursorDotRef.current) {
        gsap.to(cursorDotRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.08,
          ease: "power2.out",
        });
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest("button, a, input, textarea, [data-cursor]");
      
      if (clickable) {
        setIsHovered(true);
        const customText = clickable.getAttribute("data-cursor-text");
        if (customText) {
          setCursorText(customText);
        } else {
          setCursorText("");
        }
      } else {
        setIsHovered(false);
        setCursorText("");
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Smooth Spring Ring Lerp Loop
    let rafId: number;
    const ringLoop = () => {
      const rx = ringPos.current.x;
      const ry = ringPos.current.y;
      const mx = mousePos.current.x;
      const my = mousePos.current.y;

      ringPos.current.x += (mx - rx) * 0.15;
      ringPos.current.y += (my - ry) * 0.15;

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(ringLoop);
    };
    rafId = requestAnimationFrame(ringLoop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [isVisible]);

  return (
    <>
      {/* Tiny Primary Center Dot */}
      <div
        ref={cursorDotRef}
        className={`fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#e4d3ba] pointer-events-none z-[9999] transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${isHovered ? "opacity-0" : "opacity-100"}`}
      />

      {/* Fluid Trailing Gold Aura Ring */}
      <div
        ref={cursorRingRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9998] flex items-center justify-center transition-all duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${
          isHovered
            ? "w-14 h-14 rounded-full bg-[#c5a880]/20 border border-[#c5a880]/60 backdrop-blur-[1px] shadow-lg shadow-[#c5a880]/20 scale-100"
            : "w-8 h-8 rounded-full border border-[#c5a880]/40 scale-75"
        }`}
      >
        {cursorText && (
          <span className="text-[9px] font-mono tracking-widest uppercase text-[#f7f4ee] font-semibold select-none animate-fadeIn">
            {cursorText}
          </span>
        )}
      </div>
    </>
  );
}
