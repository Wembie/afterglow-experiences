import type { ParticlePresetName } from '../engine/schema';

export interface ParticlePreset {
  /** Particles per 100,000 CSS px² of viewport. */
  density: number;
  /** Hard cap, before the quality multiplier. */
  maxCount: number;
  /** Base drift speed in CSS px per second. */
  speed: number;
  /** Constant drift direction (px/s), e.g. rising motes. */
  drift: { x: number; y: number };
  /** Draw lines between particles closer than this (CSS px). 0 disables. */
  connectionDistance: number;
  pointer: 'repel' | 'attract' | 'none';
  /** Pointer influence radius (CSS px) and strength (px/s at the centre). */
  interactionRadius: number;
  interactionStrength: number;
  /** 0..1 — opacity of the soft halo around each particle. */
  glow: number;
  /** Seconds to fade in/out when the preset changes. */
  fade: number;
  size: [number, number];
  /** 0..1 — how much brightness oscillates. */
  twinkle: number;
}

export const particlePresets: Record<Exclude<ParticlePresetName, 'none'>, ParticlePreset> = {
  quiet: {
    density: 5,
    maxCount: 70,
    speed: 3,
    drift: { x: 0, y: -1 },
    connectionDistance: 0,
    pointer: 'repel',
    interactionRadius: 90,
    interactionStrength: 20,
    glow: 0.35,
    fade: 1.6,
    size: [0.5, 1.6],
    twinkle: 0.5,
  },
  cosmic: {
    density: 9,
    maxCount: 140,
    speed: 5,
    drift: { x: 0.6, y: 0 },
    connectionDistance: 90,
    pointer: 'repel',
    interactionRadius: 120,
    interactionStrength: 40,
    glow: 0.5,
    fade: 1.2,
    size: [0.5, 1.9],
    twinkle: 0.6,
  },
  garden: {
    density: 6,
    maxCount: 90,
    speed: 6,
    drift: { x: 1.5, y: -5 },
    connectionDistance: 0,
    pointer: 'attract',
    interactionRadius: 130,
    interactionStrength: 18,
    glow: 0.7,
    fade: 1.4,
    size: [0.8, 2.4],
    twinkle: 0.8,
  },
  celebration: {
    density: 10,
    maxCount: 160,
    speed: 9,
    drift: { x: 0, y: -4 },
    connectionDistance: 0,
    pointer: 'repel',
    interactionRadius: 140,
    interactionStrength: 60,
    glow: 0.8,
    fade: 1,
    size: [0.8, 2.6],
    twinkle: 0.9,
  },
  memoryReveal: {
    density: 7,
    maxCount: 110,
    speed: 4,
    drift: { x: 0, y: -2 },
    connectionDistance: 70,
    pointer: 'attract',
    interactionRadius: 110,
    interactionStrength: 25,
    glow: 0.6,
    fade: 1.2,
    size: [0.6, 2],
    twinkle: 0.7,
  },
};

/** Ambient particle count for a viewport, quality and preset. */
export function particleCount(
  preset: ParticlePreset,
  width: number,
  height: number,
  quality: 'high' | 'low',
): number {
  const byArea = Math.round(((width * height) / 100_000) * preset.density);
  const cap = quality === 'low' ? Math.round(preset.maxCount * 0.45) : preset.maxCount;
  return Math.max(0, Math.min(cap, byArea));
}
