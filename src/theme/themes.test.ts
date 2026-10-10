import { describe, expect, it } from 'vitest';
import { themes } from './themes';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('theme contrast (WCAG)', () => {
  for (const [name, t] of Object.entries(themes)) {
    for (const surface of [t.bg, t.skyBottom]) {
      it(`${name}: text on ${surface}`, () => {
        expect(contrast(t.text, surface)).toBeGreaterThanOrEqual(7);
        expect(contrast(t.textSecondary, surface)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t.textMuted, surface)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t.accent, surface)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
