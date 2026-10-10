# Accessibility

## What is implemented

- **Semantic structure** — each scene is a `<main>` with an accessible name and an
  optional `description` (read by screen readers, describing what is visual-only).
  Focus moves to the scene heading on every scene change.
- **Everything is a real control** — tree lights, stars, prints and timeline links are
  `<button>`s with text labels. The tree also offers a plain "All memories" list.
  Canvas particles are decorative (`aria-hidden`) and never carry content.
- **Keyboard** — everything reachable with Tab; visible focus ring (warm gold);
  Escape closes dialogs and popovers; ←/→ change photos in a gallery.
- **Dialogs** — `role="dialog"`, `aria-modal`, labelled by the memory title, focus trap,
  focus restored to the opener, background scroll locked.
- **Text** — kinetic text is real DOM text (selectable, read whole). Letter-by-letter
  names render the full name in an `sr-only` span and hide the animated letters.
  The finale exposes headline, name and message to screen readers immediately.
- **Reduced motion** — follows `prefers-reduced-motion` by default, overridable in
  Settings (_Follow system / Full / Reduced_). In reduced mode: scene swaps are instant,
  every animation finishes immediately, particles are static, no parallax, no camera-like
  zooms, the finale shows its final state, text appears at once. Content is identical.
- **Reading mode** — "Show text without animation" setting, independent of motion.
- **Contrast** — tested for every theme (`src/theme/themes.test.ts`).
- **Touch** — targets ≥ 44 px (tree lights, stars, buttons); hover effects have touch
  equivalents (scroll-centred prints glow); swipe only reacts to clearly horizontal
  gestures, so scrolling is never hijacked.
- **Audio** — never required; asked explicitly; mute is always one tap away.
- **No flashing** — brightness changes take ≥ 1 s; no strobe or continuous bursts.

## Verified by tests

Component tests use roles and accessible names (dialog name, image alt, labelled
buttons, reduced-motion text). Playwright journeys exercise keyboard Escape, touch taps,
reduced motion and no-audio paths.

## Known gaps

- No automated axe audit in CI yet.
- Constellation labels may crowd on very small screens with many memories; the tree's
  list view and the memories scene remain fully usable.
- Screen-reader testing was done through the accessibility tree in tests, not with
  NVDA/VoiceOver sessions.
