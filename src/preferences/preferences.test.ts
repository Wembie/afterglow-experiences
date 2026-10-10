import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultPreferences,
  getPreferences,
  parseStoredPreferences,
  resetPreferencesForTests,
  resolveReducedMotion,
  setPreferences,
} from './preferences';

describe('preferences', () => {
  beforeEach(() => resetPreferencesForTests());

  it('falls back to defaults for missing or corrupt storage', () => {
    expect(parseStoredPreferences(null)).toEqual(defaultPreferences);
    expect(parseStoredPreferences('{not json')).toEqual(defaultPreferences);
    expect(parseStoredPreferences('42')).toEqual(defaultPreferences);
  });

  it('keeps valid fields and drops invalid ones', () => {
    const parsed = parseStoredPreferences(
      JSON.stringify({ masterVolume: 0.3, musicVolume: 7, motion: 'sideways', readingMode: true }),
    );
    expect(parsed.masterVolume).toBe(0.3);
    expect(parsed.musicVolume).toBe(defaultPreferences.musicVolume);
    expect(parsed.motion).toBe('system');
    expect(parsed.readingMode).toBe(true);
  });

  it('persists only preferences', () => {
    setPreferences({ motion: 'reduced' });
    const stored = JSON.parse(window.localStorage.getItem('afterglow:preferences:v1') ?? '{}');
    expect(Object.keys(stored).sort()).toEqual(Object.keys(defaultPreferences).sort());
    resetPreferencesForTests();
    expect(getPreferences().motion).toBe('reduced');
  });

  it('resolves reduced motion from preference and system', () => {
    expect(resolveReducedMotion('system', true)).toBe(true);
    expect(resolveReducedMotion('system', false)).toBe(false);
    expect(resolveReducedMotion('full', true)).toBe(false);
    expect(resolveReducedMotion('reduced', false)).toBe(true);
  });
});
