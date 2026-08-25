/**
 * Ambient background palettes.
 *
 * Each palette is five stops; the shader wants a 20-step ramp, so `toRamp`
 * expands them. Stop 0 is the darkest colour and the shader renders it fully
 * transparent, which is what lets the page's own black show through.
 */

export interface Palette {
  id: string;
  name: string;
  /** Colour of the switcher's dot — a mid-tone from the ramp. */
  chip: string;
  stops: [number, number, number][];
}

export const PALETTES: Palette[] = [
  {
    id: "sea",
    name: "Thermal Blue",
    chip: "#1a6fa8",
    stops: [
      [0.0, 0.02, 0.05],
      [0.0, 0.14, 0.32],
      [0.05, 0.35, 0.6],
      [0.25, 0.65, 0.85],
      [0.85, 0.95, 1.0],
    ],
  },
  {
    id: "amber",
    name: "Warm Amber",
    chip: "#a8763f",
    stops: [
      [0.03, 0.03, 0.04],
      [0.17, 0.11, 0.07],
      [0.4, 0.26, 0.14],
      [0.66, 0.48, 0.29],
      [0.86, 0.73, 0.58],
    ],
  },
  {
    id: "jade",
    name: "Jade & Eucalyptus",
    chip: "#3d8a72",
    stops: [
      [0.02, 0.04, 0.04],
      [0.04, 0.16, 0.14],
      [0.08, 0.36, 0.3],
      [0.26, 0.6, 0.5],
      [0.68, 0.87, 0.79],
    ],
  },
  {
    id: "plum",
    name: "Aubergine",
    chip: "#6b3f66",
    stops: [
      [0.04, 0.02, 0.05],
      [0.14, 0.06, 0.16],
      [0.3, 0.14, 0.33],
      [0.52, 0.3, 0.53],
      [0.8, 0.66, 0.8],
    ],
  },
  {
    id: "rosewood",
    name: "Rosewood",
    chip: "#8e4a4a",
    stops: [
      [0.04, 0.02, 0.02],
      [0.16, 0.06, 0.07],
      [0.36, 0.15, 0.16],
      [0.6, 0.32, 0.32],
      [0.84, 0.66, 0.63],
    ],
  },
  {
    id: "onyx",
    name: "Onyx",
    chip: "#3a4149",
    stops: [
      [0.02, 0.02, 0.03],
      [0.06, 0.07, 0.08],
      [0.13, 0.15, 0.17],
      [0.24, 0.27, 0.3],
      [0.45, 0.49, 0.53],
    ],
  },
];

export const DEFAULT_PALETTE_ID = "sea";
/** Cards per… no — seconds of shader time per real second. 0.25 was the old. */
export const DEFAULT_SPEED = 0.07;

const PALETTE_KEY = "alexa-spa:palette";
const SPEED_KEY = "alexa-spa:bg-speed";

/** Fired on `window` whenever the ambient look changes. */
export const AMBIENCE_EVENT = "alexa-spa:ambience";

export function toRamp(palette: Palette, steps = 20): [number, number, number][] {
  const { stops } = palette;
  const ramp: [number, number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * (stops.length - 1);
    const low = Math.floor(t);
    const high = Math.min(low + 1, stops.length - 1);
    const f = t - low;
    ramp.push([
      stops[low][0] + (stops[high][0] - stops[low][0]) * f,
      stops[low][1] + (stops[high][1] - stops[low][1]) * f,
      stops[low][2] + (stops[high][2] - stops[low][2]) * f,
    ]);
  }
  return ramp;
}

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** Storage can throw in private windows, so every read has a fallback. */
export function readPaletteId(): string {
  if (typeof window === "undefined") return DEFAULT_PALETTE_ID;
  try {
    return window.localStorage.getItem(PALETTE_KEY) ?? DEFAULT_PALETTE_ID;
  } catch {
    return DEFAULT_PALETTE_ID;
  }
}

export function readSpeed(): number {
  if (typeof window === "undefined") return DEFAULT_SPEED;
  try {
    const raw = window.localStorage.getItem(SPEED_KEY);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : DEFAULT_SPEED;
  } catch {
    return DEFAULT_SPEED;
  }
}

export function saveAmbience(paletteId: string, speed: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PALETTE_KEY, paletteId);
    window.localStorage.setItem(SPEED_KEY, String(speed));
  } catch {
    // A viewer with site data blocked still gets the change for this visit.
  }
  window.dispatchEvent(
    new CustomEvent(AMBIENCE_EVENT, { detail: { paletteId, speed } })
  );
}
