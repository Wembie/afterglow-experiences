/**
 * Scene themes. Colours live here (not in CSS) because both the DOM and the
 * canvas particle renderer need them. They are applied as CSS custom
 * properties that are registered with @property, so themes crossfade.
 *
 * Text colours were checked against each theme's `bg` and `skyBottom` for
 * WCAG AA (text ≥ 7:1, secondary ≥ 4.5:1, muted ≥ 4.5:1).
 */
import type { Experience, ParticlePresetName, ThemeName } from '../engine/schema';

export interface ThemeTokens {
  bg: string;
  skyTop: string;
  skyBottom: string;
  atmosphere: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  glow: string;
  warm: string;
  particles: string[];
  defaultParticles: ParticlePresetName;
}

export const themes: Record<ThemeName, ThemeTokens> = {
  'cosmic-night': {
    bg: '#090B18',
    skyTop: '#090B18',
    skyBottom: '#10152A',
    atmosphere: '#2A2470',
    text: '#F5F1FF',
    textSecondary: '#CFCBEA',
    textMuted: '#AAA6C8',
    accent: '#A799FF',
    accentSecondary: '#75D7FF',
    glow: '#B9AEFF',
    warm: '#FFD99A',
    particles: ['#F5F1FF', '#B9AEFF', '#75D7FF'],
    defaultParticles: 'cosmic',
  },
  'memory-garden': {
    bg: '#0B1411',
    skyTop: '#0B1411',
    skyBottom: '#15241D',
    atmosphere: '#2F4A3A',
    text: '#F4F1E6',
    textSecondary: '#D3D9C8',
    textMuted: '#A9B5A3',
    accent: '#C2DDB2',
    accentSecondary: '#F3E6C8',
    glow: '#D8F0C0',
    warm: '#FFD99A',
    particles: ['#F3E6C8', '#CDEBB0', '#FFD99A'],
    defaultParticles: 'garden',
  },
  'golden-hour': {
    bg: '#170F10',
    skyTop: '#1A1113',
    skyBottom: '#33201A',
    atmosphere: '#7A4228',
    text: '#FFF4E8',
    textSecondary: '#EED8C6',
    textMuted: '#CDB3A1',
    accent: '#FFC88A',
    accentSecondary: '#F1A6CF',
    glow: '#FFD99A',
    warm: '#FFD99A',
    particles: ['#FFD99A', '#FFB27A', '#F1A6CF'],
    defaultParticles: 'quiet',
  },
  'birthday-finale': {
    bg: '#120C22',
    skyTop: '#140D27',
    skyBottom: '#28163D',
    atmosphere: '#6B3786',
    text: '#FFF8FD',
    textSecondary: '#EBDAF0',
    textMuted: '#C8B5D4',
    accent: '#F6B6D8',
    accentSecondary: '#FFD99A',
    glow: '#FFE9F4',
    warm: '#FFD99A',
    particles: ['#FFD99A', '#F1A6CF', '#B9AEFF', '#F5F1FF'],
    defaultParticles: 'celebration',
  },
  'quiet-ending': {
    bg: '#0A0D1A',
    skyTop: '#0A0D1A',
    skyBottom: '#11172D',
    atmosphere: '#2B3156',
    text: '#EEF0FA',
    textSecondary: '#CACDE1',
    textMuted: '#A3A7C2',
    accent: '#C9CDEB',
    accentSecondary: '#AAA6C8',
    glow: '#DDE0F5',
    warm: '#E9D9B8',
    particles: ['#DDE0F5', '#AAA6C8'],
    defaultParticles: 'quiet',
  },
};

/** Applies per-experience accent overrides on top of a theme. */
export function resolveTheme(name: ThemeName, experience: Experience): ThemeTokens {
  const base = themes[name];
  const { accents } = experience.theme;
  return {
    ...base,
    accent: accents.primary ?? base.accent,
    accentSecondary: accents.secondary ?? base.accentSecondary,
    glow: accents.glow ?? base.glow,
    warm: accents.warm ?? base.warm,
  };
}

export function themeToCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    '--color-bg': tokens.bg,
    '--color-sky-top': tokens.skyTop,
    '--color-sky-bottom': tokens.skyBottom,
    '--color-atmosphere': tokens.atmosphere,
    '--color-text': tokens.text,
    '--color-text-secondary': tokens.textSecondary,
    '--color-text-muted': tokens.textMuted,
    '--color-accent': tokens.accent,
    '--color-accent-secondary': tokens.accentSecondary,
    '--color-glow': tokens.glow,
    '--color-warm': tokens.warm,
  };
}
