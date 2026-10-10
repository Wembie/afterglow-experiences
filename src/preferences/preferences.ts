/**
 * Visitor preferences. Only these settings are persisted — never content,
 * progress or which memories were opened.
 */
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'afterglow:preferences:v1';

export interface Preferences {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  effectsEnabled: boolean;
  motion: 'system' | 'full' | 'reduced';
  quality: 'auto' | 'high' | 'low';
  readingMode: boolean;
}

// Hand-written validators keep zod out of the initial bundle.
const unit = (v: unknown): v is number => typeof v === 'number' && v >= 0 && v <= 1;
const bool = (v: unknown): v is boolean => typeof v === 'boolean';
const oneOf =
  <T extends string>(...values: T[]) =>
  (v: unknown): v is T =>
    typeof v === 'string' && (values as string[]).includes(v);

const validators: { [K in keyof Preferences]: (v: unknown) => v is Preferences[K] } = {
  masterVolume: unit,
  musicVolume: unit,
  effectsVolume: unit,
  effectsEnabled: bool,
  motion: oneOf('system', 'full', 'reduced'),
  quality: oneOf('auto', 'high', 'low'),
  readingMode: bool,
};

export const defaultPreferences: Preferences = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  effectsVolume: 0.6,
  effectsEnabled: true,
  motion: 'system',
  quality: 'auto',
  readingMode: false,
};

/** Accepts anything from storage; keeps valid fields, drops invalid ones. */
export function parseStoredPreferences(raw: string | null): Preferences {
  if (!raw) return defaultPreferences;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return defaultPreferences;
  }
  if (typeof data !== 'object' || data === null) return defaultPreferences;
  const result: Preferences = { ...defaultPreferences };
  for (const key of Object.keys(validators) as (keyof Preferences)[]) {
    const value = (data as Record<string, unknown>)[key];
    if (validators[key](value)) (result as unknown as Record<string, unknown>)[key] = value;
  }
  return result;
}

function readStorage(): Preferences {
  try {
    return parseStoredPreferences(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return defaultPreferences;
  }
}

let state: Preferences | null = null;
const listeners = new Set<() => void>();

export function getPreferences(): Preferences {
  state ??= readStorage();
  return state;
}

export function setPreferences(patch: Partial<Preferences>): void {
  state = { ...getPreferences(), ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); preferences still apply for this visit.
  }
  listeners.forEach((l) => l());
}

/** Test helper. */
export function resetPreferencesForTests(): void {
  state = null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getPreferences, () => defaultPreferences);
}

// ---------------------------------------------------------------------------
// System reduced-motion
// ---------------------------------------------------------------------------

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeSystemMotion(listener: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}

function systemPrefersReduced(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_QUERY).matches;
}

export function resolveReducedMotion(pref: Preferences['motion'], system: boolean): boolean {
  if (pref === 'reduced') return true;
  if (pref === 'full') return false;
  return system;
}

export function useReducedMotion(): boolean {
  const { motion } = usePreferences();
  const system = useSyncExternalStore(subscribeSystemMotion, systemPrefersReduced, () => false);
  return resolveReducedMotion(motion, system);
}

/** Effective quality: "auto" picks light rendering on small or low-memory devices. */
export function resolveQuality(pref: Preferences['quality']): 'high' | 'low' {
  if (pref !== 'auto') return pref;
  if (typeof window === 'undefined') return 'high';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2;
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 2;
  return lowMemory || lowCores ? 'low' : 'high';
}
