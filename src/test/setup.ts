import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has no canvas; the particle field must tolerate that (it is decorative).
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

window.scrollTo = (() => {}) as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.location.hash = '';
});
