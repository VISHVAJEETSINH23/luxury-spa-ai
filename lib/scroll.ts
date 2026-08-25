/**
 * Section scrolling that goes through Lenis.
 *
 * The hero boots a Lenis instance that takes over the wheel, so a native
 * `scrollIntoView` or a plain hash jump fights it — the page lands hard or not
 * at all. Lenis publishes itself on `window.__lenis`; everything that wants to
 * move the page asks for it here and falls back to the native path when the
 * hero (and therefore Lenis) isn't mounted.
 */

interface LenisLike {
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number; easing?: (t: number) => number }
  ) => void;
}

declare global {
  interface Window {
    __lenis?: LenisLike;
  }
}

/** Clears the fixed navbar so a heading never lands underneath it. */
const NAV_OFFSET = -104;

export function scrollToSection(id: string): void {
  if (typeof window === "undefined") return;

  const element = document.getElementById(id);
  if (!element) return;

  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(element, {
      offset: NAV_OFFSET,
      duration: 1.6,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
  } else {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Keep the address bar honest without letting the browser jump us there.
  if (window.location.hash !== `#${id}`) {
    window.history.replaceState(null, "", `#${id}`);
  }
}

export function scrollToTop(): void {
  if (typeof window === "undefined") return;
  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(0, { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
