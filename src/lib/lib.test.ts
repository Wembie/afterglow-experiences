import { describe, expect, it } from 'vitest';
import { layoutStars, linkStars } from './constellation';
import { generateTree, traceToRoot } from './tree';
import { particleCount, particlePresets } from '../particles/presets';

describe('generateTree', () => {
  it('is deterministic for a seed', () => {
    expect(generateTree(42, 6)).toEqual(generateTree(42, 6));
    expect(generateTree(42, 6).branches[3]?.d).not.toEqual(generateTree(43, 6).branches[3]?.d);
  });

  it('keeps the DOM small and places every memory', () => {
    for (const count of [0, 1, 6, 12, 20]) {
      const tree = generateTree(7, count);
      expect(tree.spots).toHaveLength(count);
      expect(tree.branches.length).toBeLessThan(400);
      expect(tree.leafPaths).toHaveLength(3);
    }
  });

  it('keeps memory lights apart so touch targets do not overlap', () => {
    const tree = generateTree(11, 8);
    for (const a of tree.spots) {
      for (const b of tree.spots) {
        if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(30);
      }
    }
  });

  it('traces a trail from the trunk to a memory', () => {
    const tree = generateTree(3, 4);
    const trail = traceToRoot(tree.branches, tree.spots[0]!.branch);
    expect(trail.startsWith(tree.branches[0]!.d)).toBe(true);
  });
});

describe('constellation', () => {
  it('honours manual positions and keeps stars inside the sky', () => {
    const stars = layoutStars(['a', 'b', 'c', 'd'], 1, { b: { x: 10, y: 20 } });
    expect(stars.find((s) => s.id === 'b')).toEqual({ id: 'b', x: 10, y: 20 });
    for (const s of stars) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(100);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(100);
    }
  });

  it('links stars in story order', () => {
    const links = linkStars(layoutStars(['a', 'b', 'c'], 1));
    expect(links.slice(0, 2)).toEqual([
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ]);
  });
});

describe('particleCount', () => {
  it('scales with area and caps by quality', () => {
    const p = particlePresets.cosmic;
    expect(particleCount(p, 375, 700, 'high')).toBeLessThan(particleCount(p, 1440, 900, 'high'));
    expect(particleCount(p, 3840, 2160, 'high')).toBe(p.maxCount);
    expect(particleCount(p, 3840, 2160, 'low')).toBeLessThan(p.maxCount);
  });
});
