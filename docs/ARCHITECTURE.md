# Architecture

## Stack

| Concern    | Choice                               | Why                                                            |
| ---------- | ------------------------------------ | -------------------------------------------------------------- |
| UI         | React 19 + TypeScript (strict)       | Component model for scenes; strict types for the configuration |
| Build      | Vite 8                               | Static output, code splitting, configurable base path          |
| Validation | Zod 4 (lazy-loaded)                  | One schema → runtime validation and inferred types             |
| Rendering  | Semantic HTML + SVG + one Canvas 2D  | Accessible content, cheap effects, no WebGL dependency         |
| Audio      | Web Audio API                        | Crossfades, synthesis, stereo panning without libraries        |
| Tests      | Vitest + Testing Library, Playwright | Behaviour-level component tests; real-browser journeys         |

No state library, router library, animation library or Three.js.

### Why no Three.js

The tree and constellation were evaluated as WebGL scenes. A procedural SVG tree gives
the luminous, organic look with ~200 paths, grows in with `stroke-dashoffset`, keeps
memory points as real `<button>`s, works without WebGL and costs ~2.5 KB gzipped
instead of ~150 KB. Depth comes from layered gradients, the parallax of the particle
canvas, blur and light. If a future scene genuinely needs 3D, register it as a lazy scene
type with an SVG fallback.

## Layout

```
build/                 build-time env parsing + Vite plugin (virtual module, <head> tags)
deployments/           public deployment profiles (*.env)
public/experiences/    per-experience assets (photos, audio)
scripts/               authoring and deployment helpers
src/
  engine/              schema, validation, router, runner, scene registry, strings, dates
  scenes/              one module (+ CSS) per scene type, lazy-loaded except arrival
  components/          dialog, gallery, photo, reveal text, chrome, icons
  particles/           ParticleEngine (canvas) + presets + React provider
  audio/               AudioManager + React provider
  preferences/         persisted visitor preferences, reduced-motion resolution
  theme/               theme tokens (single source for CSS vars and canvas colours)
  lib/                 deterministic generators (tree, constellation, PRNG)
  experiences/<slug>/  experience.ts — the content
  styles/              tokens.css, base.css
```

## Runtime flow

1. `main.tsx` mounts `App`.
2. `App` reads the hash (`#/<slug>/<scene>`), or uses the build's default experience.
3. The experience module and the validator load **in parallel** (`Promise.all`).
4. `validateExperience` returns the typed experience with defaults filled, or errors.
5. `ExperienceRunner` provides audio, particles and the `ExperienceContext`, applies the
   scene theme to `<html>` as CSS variables, resolves the music in effect, and renders
   the scene through `sceneRegistry` inside an error boundary and `Suspense`.

## Build-time configuration

`build/afterglow-env.ts` reads `AFTERGLOW_*` variables and computes the base path.
`build/afterglow-plugin.ts`:

- exposes `virtual:afterglow-experiences` with loaders for **only** the selected slugs,
  so other people's content is never bundled;
- deletes `dist/experiences/<other-slug>/` after the build;
- injects title, description, theme colour, Open Graph tags and `noindex`.

## State

| State              | Where                                      | Persisted                 |
| ------------------ | ------------------------------------------ | ------------------------- |
| Experience / scene | URL hash                                   | URL only                  |
| Open memory        | `Stage` (scoped to the scene it opened in) | no                        |
| Explored memories  | `Stage`                                    | no                        |
| Gallery index      | `Gallery`                                  | no                        |
| Audio status       | `AudioManager` (external store)            | no — asked every visit    |
| Preferences        | `preferences.ts` (external store)          | `localStorage`, validated |

## Failure isolation

- Invalid configuration → error page (details only in development).
- Unknown scene type or a crashing scene → per-scene fallback; navigation keeps working.
- No Canvas → no particles; no Web Audio → silent; image error → designed placeholder;
  audio file error → silence; unknown scene id → first scene; unknown experience →
  default experience.

## Adding a scene type

1. Add a Zod object to `sceneDefinition` in `schema.ts` and its name to `sceneTypes`.
2. Create `src/scenes/MyScene.tsx` exporting `default function MyScene({ scene })`.
3. Register the loader in `sceneRegistry.ts`.
4. Document it in `CONTENT_CONFIGURATION.md`; bump the MINOR version.
