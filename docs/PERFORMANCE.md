# Performance

## Budgets (gzipped) and measured build (Isa profile, v1.0.0)

| Asset                           | Budget   | Measured |
| ------------------------------- | -------- | -------- |
| Initial JS (`index-*.js`)       | ≤ 100 KB | 84 KB    |
| Validator chunk (zod, parallel) | ≤ 35 KB  | 28 KB    |
| Experience content chunk        | ≤ 10 KB  | 2.6 KB   |
| Largest scene chunk (tree)      | ≤ 10 KB  | 2.5 KB   |
| Initial CSS                     | ≤ 15 KB  | 6.6 KB   |
| Fonts on first paint (Latin)    | ≤ 200 KB | ~140 KB  |
| Critical images                 | 0        | 0        |

Measure with `npm run build` (Vite prints sizes).

## Strategy

- **Lazy everything optional** — every scene except the arrival is its own chunk; the
  next scene's chunk is preloaded while the current one is read. The validator loads
  in parallel with the content. Audio files load only after the visitor enables sound.
- **One particle canvas** for the whole app, one `requestAnimationFrame` loop, glow drawn
  from cached sprites (no per-frame gradients or `shadowBlur`), typed caps per preset,
  density scaled by viewport area, `devicePixelRatio` capped at 2 (1 in _Light_ quality),
  connection lines only in the presets that need them. The loop sleeps when there is
  nothing to animate, stops when the tab is hidden, and is not run at all in reduced motion.
- **Quality presets** — Settings → Visual quality: _Auto_ (light on ≤ 2 GB memory or
  ≤ 2 cores, where the browser reports it), _High_, _Light_ (≈45 % particles, DPR 1,
  half-size bursts). No aggressive GPU detection.
- **Cheap animation** — transforms, opacity and filters on small elements; theme changes
  interpolate registered custom properties; no layout animation; no React state per frame.
- **No 3D library**; the tree is ~200 SVG paths with leaves merged into 3 compound paths.
- **Images** — lazy, async decode, reserved dimensions.
- **Cleanup** — every listener, timer, rAF loop and AudioContext is released on unmount.

## Known costs

- Full-screen modal backdrop uses `backdrop-filter: blur(6px)` (only while open).
- Fraunces italic is ~78 KB; it loads when italic text first appears (invitation).
