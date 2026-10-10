/**
 * Procedural tree for "The Tree of Memories".
 *
 * Generates a few hundred lines of SVG path data at most: branches are
 * individual paths (so they can grow in), while all leaves collapse into a
 * handful of compound paths — no per-leaf DOM nodes.
 */
import { createRandom } from './random';

export interface Point {
  x: number;
  y: number;
}

export interface Branch {
  id: number;
  parent: number | null;
  depth: number;
  from: Point;
  to: Point;
  d: string;
  width: number;
}

export interface MemorySpot extends Point {
  /** Branch the spot hangs from; used to trace the energy trail to the trunk. */
  branch: number;
}

export interface TreeModel {
  size: number;
  base: Point;
  branches: Branch[];
  roots: Branch[];
  /** Compound path data, grouped so each group can shimmer independently. */
  leafPaths: string[];
  spots: MemorySpot[];
}

const SIZE = 1000;
const MAX_DEPTH = 6;

const r1 = (n: number) => Math.round(n * 10) / 10;

function curve(from: Point, to: Point, bend: number): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Control point offset perpendicular to the segment: organic, never straight.
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  return `M${r1(from.x)} ${r1(from.y)}Q${r1(cx)} ${r1(cy)} ${r1(to.x)} ${r1(to.y)}`;
}

export function generateTree(seed: number, spotCount: number): TreeModel {
  const random = createRandom(seed);
  const base: Point = { x: SIZE / 2, y: SIZE * 0.9 };
  const branches: Branch[] = [];

  const grow = (
    from: Point,
    angle: number,
    length: number,
    width: number,
    depth: number,
    parent: number | null,
  ) => {
    const to: Point = {
      x: from.x + Math.sin(angle) * length,
      y: from.y - Math.cos(angle) * length,
    };
    const id = branches.length;
    branches.push({
      id,
      parent,
      depth,
      from,
      to,
      width,
      d: curve(from, to, (random() - 0.5) * 0.35),
    });
    if (depth >= MAX_DEPTH) return;

    const children = depth < 2 ? 2 : random() < 0.28 ? 3 : 2;
    const spread = 0.24 + random() * 0.16 + depth * 0.025;
    for (let i = 0; i < children; i++) {
      const t = i / (children - 1) - 0.5;
      // Pull outer branches back toward vertical so the canopy stays rounded.
      const upward = -angle * 0.3;
      const childAngle = angle + t * spread * 2 + upward + (random() - 0.5) * 0.18;
      const childLength = length * (0.7 + random() * 0.14);
      grow(to, childAngle, childLength, width * 0.68, depth + 1, id);
    }
  };

  // Trunk: two segments with a gentle lean.
  const lean = (random() - 0.5) * 0.12;
  grow(base, lean, SIZE * 0.215, 24, 0, null);

  // Roots: shallow, spreading, a little luminous.
  const roots: Branch[] = [];
  for (let i = 0; i < 5; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const spreadX = (60 + random() * 160) * side * (i === 4 ? 0.3 : 1);
    const to = { x: base.x + spreadX, y: base.y + 25 + random() * 45 };
    roots.push({
      id: -1 - i,
      parent: null,
      depth: 0,
      from: base,
      to,
      width: 6 - i * 0.6,
      d: curve(base, to, side * 0.18),
    });
  }

  // Leaves cluster around the outer branches.
  const leafGroups: string[][] = [[], [], []];
  for (const b of branches) {
    if (b.depth < MAX_DEPTH - 2) continue;
    const count = b.depth === MAX_DEPTH ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const t = 0.35 + random() * 0.65;
      const x = b.from.x + (b.to.x - b.from.x) * t + (random() - 0.5) * 34;
      const y = b.from.y + (b.to.y - b.from.y) * t + (random() - 0.5) * 34;
      const r = 2.2 + random() * 4.2;
      leafGroups[Math.floor(random() * leafGroups.length)]!.push(
        `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(r * 2)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-r * 2)} 0`,
      );
    }
  }

  return {
    size: SIZE,
    base,
    branches,
    roots,
    leafPaths: leafGroups.map((g) => g.join('')),
    spots: pickSpots(branches, spotCount),
  };
}

/**
 * Chooses where memories hang: branch ends spread evenly around the canopy,
 * kept apart so touch targets never overlap.
 */
function pickSpots(branches: Branch[], count: number): MemorySpot[] {
  if (count <= 0) return [];
  const candidates = branches
    .filter((b) => b.depth >= 4)
    .map((b) => ({ x: b.to.x, y: b.to.y, branch: b.id, depth: b.depth }));
  const center = { x: SIZE / 2, y: SIZE * 0.42 };
  candidates.sort(
    (a, b) =>
      Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x),
  );

  // Minimum distance shrinks if many memories need to fit.
  let minDistance = Math.max(60, 190 - count * 6);
  let chosen: MemorySpot[] = [];
  while (minDistance >= 30) {
    chosen = [];
    const step = candidates.length / count;
    for (let i = 0; i < count; i++) {
      // Try the evenly spaced candidate, then neighbours, keeping distance.
      const startIndex = Math.floor(i * step);
      for (let k = 0; k < candidates.length; k++) {
        const c = candidates[(startIndex + k) % candidates.length]!;
        if (c.x < 70 || c.x > SIZE - 70 || c.y < 60) continue;
        if (chosen.every((s) => Math.hypot(s.x - c.x, s.y - c.y) >= minDistance)) {
          chosen.push({ x: c.x, y: c.y, branch: c.branch });
          break;
        }
      }
    }
    if (chosen.length === count) break;
    minDistance -= 15;
  }
  // Keyboard order follows reading order: left to right, top to bottom.
  return chosen.sort((a, b) => a.x - b.x || a.y - b.y);
}

/** Path data from the trunk to a branch, used for the energy trail. */
export function traceToRoot(branches: Branch[], branchId: number): string {
  const chain: Branch[] = [];
  let current: Branch | undefined = branches[branchId];
  while (current) {
    chain.unshift(current);
    current = current.parent === null ? undefined : branches[current.parent];
  }
  return chain.map((b) => b.d).join('');
}
