# Changelog

All notable changes to this project are documented here. The project follows
[Semantic Versioning](https://semver.org/): breaking changes to the experience
configuration schema (`schemaVersion`) bump the MAJOR version and come with a
migration guide in this file.

## [1.0.0] — 2026-10-10

First release of the AFTERGLOW engine and the first experience, "Isa — Un universo propio".

### Engine

- Typed, validated experience configuration (`src/engine/schema.ts`, schema version 1)
  with cross-reference checks (unknown images, memories, messages, tracks, duplicate ids).
- Scene engine with nine scene types: `arrival`, `memories`, `tree`, `constellation`,
  `timeline`, `names`, `message`, `celebration`, `closing`. Any order, any subset.
- Hash routing (`#/<experience>/<scene>`) that works under any base path.
- Per-scene themes that crossfade (registered CSS custom properties).
- Shared canvas particle engine with presets, pointer reactions, ripples, bursts and a
  gather/release effect; pauses when the tab is hidden; static in reduced motion.
- Centralised `AudioManager`: one AudioContext created only after a gesture, crossfading
  file or generative (synthesised) tracks, synthesised interaction chimes with gentle
  stereo placement, volume/mute controls, silent fallback for every failure.
- Procedural SVG "Tree of Memories" and "Our Constellation" with accessible buttons.
- Memory dialog with gallery (buttons, arrow keys, swipe), focus trap and Escape.
- Kinetic typography (`fade`, `words`, `lines`, `handwritten`, `light-sweep`) that stays
  real, selectable text; reading mode and reduced motion show text immediately.
- Visitor preferences (volumes, effects, motion, quality, reading mode) persisted and
  validated; nothing else is stored.

### Deployment

- Build-time settings via `AFTERGLOW_*` environment variables: public URL / base path,
  bundled experiences, default experience, title, description, share image.
- Only the selected experiences (and their public assets) are emitted into a build.
- Deployment profiles (`deployments/<name>.env`) and a GitHub Actions workflow that runs
  all checks, then publishes each profile — to another repository (custom path such as
  `wembie.github.io/mejoramigaisa`) or to this repository's Pages site.

### Tooling

- `npm run new-experience`, `npm run photos`, `scripts/profile.mjs`, `scripts/screenshots.mjs`.
- Vitest unit/component tests and Playwright journeys against a production build served
  under a non-root base path.
