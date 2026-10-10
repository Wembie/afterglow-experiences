# Asset pipeline

## Folders

```
public/
  favicon.svg
  og-image.png                 neutral share image (no personal content)
  experiences/
    <slug>/
      photos/                  images referenced from assets.images
      audio/                   music you may publish
```

Paths in configuration are relative to `public/experiences/<slug>/`
(`photos/beach.webp`). The engine prefixes the deployment base path, so the same file
works at `/`, `/afterglow-experiences/` or `/mejoramigaisa/`. Absolute `https://` URLs
are also accepted.

Builds include only the folders of the experiences listed in `AFTERGLOW_EXPERIENCES`.

## Adding photos

1. Export from your phone/computer. Remove anything you would not publish (EXIF GPS is
   stripped by most converters below — check).
2. Resize to at most ~2000 px on the long edge and convert to **WebP** (or AVIF), aiming
   for 150–400 KB each. Good local tools: [Squoosh](https://squoosh.app) (runs in the
   browser, nothing uploaded), `cwebp`, ImageMagick (`magick in.jpg -resize 2000x2000\> -quality 80 out.webp`).
3. Copy to `public/experiences/<slug>/photos/`.
4. Run `npm run photos -- <slug>` — it prints `assets.images` entries with real
   width/height and warns about files over 400 KB.
5. Paste, write real `alt` text, add `focalPoint`/`caption` where useful, reference the
   ids from memories (`photos: ['beach', 'beach-2']`), timeline events or nicknames.
6. `npm run dev` and open `http://localhost:5173/#/<slug>`.

The project does not add an image-processing dependency; optimisation is a deliberate
step done before committing. SVG placeholders in `isa/photos` are abstract artwork meant
to be replaced.

## Loading behaviour

- Images are `loading="lazy"` and `decoding="async"` unless `priority: 'high'`.
- Width/height (or aspect-ratio) reserve space — no layout shift.
- `focalPoint` maps to `object-position`; galleries show the whole photo (`contain`).
- A failed image becomes a designed placeholder with the same alt text.
- Nothing is preloaded at start; scenes load their own images when shown.

## Audio

MP3 (128–192 kbps) or OGG/Opus, loudness-normalised, a clean loop point for loops.
Files load only after the visitor enables sound. Credit the author in `credit` when the
licence requires it (shown in the settings panel). Generative tracks need no files.

## Fonts

Bundled from `@fontsource` packages at build time (no Google Fonts request). Latin files:
Fraunces SOFT normal 62 KB + italic 78 KB, Manrope 25 KB, Caveat 51 KB (woff2).
