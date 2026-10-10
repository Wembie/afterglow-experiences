import { createRandom } from './random';

export interface Star {
  id: string;
  x: number;
  y: number;
}

export interface Link {
  from: string;
  to: string;
}

/**
 * Places stars in percent coordinates. Manual positions win; the rest are
 * spread with jittered columns so the sky feels natural but never clumps.
 * Positions are stable — stars never move away from a visitor's pointer.
 */
export function layoutStars(
  ids: string[],
  seed: number,
  manual: Record<string, { x: number; y: number }> = {},
  /** Column count; narrow screens use fewer so labels never collide. */
  columns?: number,
): Star[] {
  const random = createRandom(seed);
  const count = ids.length;
  const cols = Math.max(1, Math.min(count, columns ?? Math.ceil(Math.sqrt(count * 1.6))));
  const rows = Math.max(1, Math.ceil(count / cols));
  return ids.map((id, i) => {
    const fixed = manual[id];
    if (fixed) return { id, ...fixed };
    const col = i % cols;
    // Snake through rows so chronological neighbours stay close.
    const row = Math.floor(i / cols);
    const c = row % 2 === 0 ? col : cols - 1 - col;
    const cellW = 84 / cols;
    const cellH = 76 / rows;
    return {
      id,
      x: 8 + cellW * (c + 0.2 + random() * 0.6),
      y: 12 + cellH * (row + 0.2 + random() * 0.6),
    };
  });
}

/** Story order links, plus a few short cross links for a constellation feel. */
export function linkStars(stars: Star[]): Link[] {
  const links: Link[] = [];
  for (let i = 1; i < stars.length; i++) {
    links.push({ from: stars[i - 1]!.id, to: stars[i]!.id });
  }
  for (let i = 0; i < stars.length; i++) {
    const a = stars[i]!;
    let best: Star | null = null;
    let bestD = Infinity;
    for (let j = i + 2; j < stars.length; j++) {
      const b = stars[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    if (best && bestD < 22 && i % 2 === 0) links.push({ from: a.id, to: best.id });
  }
  return links;
}
