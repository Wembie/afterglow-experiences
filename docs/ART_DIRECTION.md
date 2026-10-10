# Art direction — _The Living Universe_

## Concept

A night sky that slowly becomes personal. Light is the material: every interaction adds
or moves light rather than moving boxes. Surfaces are rare; most content sits directly on
the sky, the way words sit on a page.

Reference territory (moods, not things to copy): long-exposure night photography, film
grain on old prints, botanical illustration, editorial magazine typography, the warmth of
a lamp in a dark room.

## Scene moods

| Scene (Isa)      | Theme             | Mood                                 |
| ---------------- | ----------------- | ------------------------------------ |
| Arrival          | `cosmic-night`    | Quiet, dark, one light, curiosity    |
| Memories         | `golden-hour`     | Warm, photographic, intimate         |
| Timeline / names | `cosmic-night`    | Editorial, spatial                   |
| Tree             | `memory-garden`   | Organic, luminous, natural           |
| Constellation    | `cosmic-night`    | Connected, exploratory               |
| Letter / closing | `quiet-ending`    | Calm, silvery, personal              |
| Finale           | `birthday-finale` | Celebratory, pearlescent, expressive |

Themes crossfade over ~1.4 s using registered CSS custom properties, so the sky itself
changes colour between chapters.

## Palette

Defined once in `src/theme/themes.ts` (DOM and canvas share it). Starting palette:
Obsidian `#090B18`, Midnight `#10152A`, Cosmic Violet `#8875FF` (lightened to `#A799FF`
for text-on-dark contrast), Electric Blue `#75D7FF`, Soft Rose `#F1A6CF`, Starlight
`#F5F1FF`, Warm Gold `#FFD99A`, Muted Lavender `#AAA6C8`. Each theme defines background,
sky gradient, atmosphere, three text levels, two accents, glow, warm highlight and
particle colours. A unit test enforces WCAG contrast for every theme (text ≥ 7:1,
secondary/muted/accent ≥ 4.5:1).

## Typography

- **Fraunces** (variable, SOFT axis, normal + italic) — display. Soft, slightly
  old-style, emotional without being decorative. Italic is used for invitations and the
  recipient's name.
- **Manrope** (variable) — body and interface. Calm, highly legible.
- **Caveat 500** — handwritten accents only: dates, short notes, signatures. Never long text.

All fonts are bundled locally (`@fontsource`), loaded with `font-display: swap` and
split by unicode range so only Latin files download for Spanish/English.

## Materials

- **Sky** — vertical gradient + atmospheric horizon glow + faint accent bloom + film grain.
- **Prints** — photos sit in a thin warm paper border with a slight tilt; they are dimmed
  until approached (hover, focus, or centred on screen on touch), then straighten and glow.
- **Light** — glow sprites on canvas, radial gradients in CSS, never large `box-shadow`s
  or full-viewport `backdrop-filter` (only the modal backdrop uses a small blur).
- **Translucency** — the dialog panel and popovers only.

## Motion principles

| Token            | Value   | Use                                 |
| ---------------- | ------- | ----------------------------------- |
| `--dur-instant`  | 100 ms  | press feedback                      |
| `--dur-small`    | 180 ms  | hovers, toggles                     |
| `--dur-standard` | 300 ms  | dialogs, popovers                   |
| `--dur-scene`    | 650 ms  | scene entry (leave phase is 280 ms) |
| `--dur-theme`    | 1400 ms | sky colour change                   |

Named presets: `gentleReveal` (fade+lift+unblur), `cinematicReveal` (word/line),
`sceneCrossfade`/`rise`/`bloom`, `memoryPulse` (photo surfaces like a developing print),
`treeAwakening` (branches grow by depth), `constellationConnect` (lines light when both
ends are visited), `celebrationBurst`, `softRipple`, `ambientFloat` (particles).
Feedback is immediate even when the surrounding scene moves slowly. Reduced motion
collapses durations to 1 ms and shows final states.

## Spatial depth (six layers)

1. Sky gradient 2. Particle canvas (with depth-based pointer parallax, ±10 px)
2. Scene content 4. Interactive points (tree/stars) 5. Foreground glow (finale rays)
3. Chrome (controls, navigation) and dialogs.

## Iconography

Hairline 1.5 px stroke icons drawn for the project (`components/Icons.tsx`); no emoji in
navigation.

## Sound direction

Soft, sustained, unresolved pads (generative), short sine chimes for discovery, a rising
four-note arpeggio for the finale. Stereo movement is subtle (±0.6) and mono-safe.

## Responsive art direction

Phones: single column, prints untilted on approach via scroll position, tree sized to
the viewport, constellation in two columns, shorter labels. Desktop: staggered print
layout, alternating timeline around a centred filament, wider tree, pointer parallax.
