/**
 * Minimal hash router. Hash routing keeps the app fully static: GitHub Pages
 * never needs to resolve deep links, and the build works under any base path.
 *
 *   #/                 → default experience (or the lobby)
 *   #/<slug>           → first scene of an experience
 *   #/<slug>/<scene>   → a specific scene
 */
import { useSyncExternalStore } from 'react';

export interface Route {
  slug: string | null;
  sceneId: string | null;
}

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  const [slug, sceneId] = clean
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  return { slug: slug ?? null, sceneId: sceneId ?? null };
}

export function buildHash(slug: string, sceneId?: string | null): string {
  const parts = [slug, sceneId].filter((p): p is string => Boolean(p)).map(encodeURIComponent);
  return `#/${parts.join('/')}`;
}

export function navigate(slug: string, sceneId?: string | null, replace = false): void {
  const hash = buildHash(slug, sceneId);
  if (window.location.hash === hash) return;
  if (replace) {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  return parseHash(hash);
}
