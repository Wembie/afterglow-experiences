# Content configuration

An experience is one TypeScript file, `src/experiences/<slug>/experience.ts`, plus its
assets in `public/experiences/<slug>/`. No component needs to change.

```ts
import { defineExperience } from '../../engine/define';

export default defineExperience({
  schemaVersion: 1,
  id: 'isa-birthday',
  slug: 'isa', // folder name; used in #/isa and asset paths
  locale: 'es', // UI strings (es, en) and date formatting
  meta: { title: 'Isa — Un universo propio' },
  recipient: { name: 'Isa' },
  occasion: { type: 'birthday', title: 'Un universo propio' },
  relationship: { type: 'friendship' },
  scenes: [/* … */],
});
```

`defineExperience` gives autocompletion and type errors while editing. At runtime the
file is validated by `src/engine/schema.ts`; in development, problems are shown with
their path (e.g. `memories.2.photos.0: unknown image "beach"`), in production the
visitor sees a calm error page instead of a broken experience.

## Top-level fields

| Field           | Required | Notes                                                                                         |
| --------------- | -------- | --------------------------------------------------------------------------------------------- |
| `schemaVersion` | yes      | `1`                                                                                           |
| `id`, `slug`    | yes      | `slug`: lowercase letters, numbers, dashes                                                    |
| `locale`        |          | default `es`                                                                                  |
| `meta`          | yes      | `{ title, description? }` — browser tab title                                                 |
| `recipient`     | yes      | `{ name }` — used by the celebration when no name is given                                    |
| `creator`       |          | `{ name?, signature? }` — signature used by the closing scene                                 |
| `occasion`      | yes      | `type`: birthday, anniversary, graduation, farewell, milestone, memorial, celebration, custom |
| `relationship`  | yes      | `type`: friendship, romantic, family, mentor, colleague, community, custom; `label?`          |
| `theme`         |          | `{ base, accents? { primary, secondary, glow, warm } }`                                       |
| `navigation`    |          | `{ showProgress, showSceneIndex }` (both default `true`)                                      |
| `strings`       |          | Override any UI label (see `src/engine/strings.ts`)                                           |
| `assets.images` |          | Image manifest, keyed by id                                                                   |
| `audio`         |          | `{ tracks, effects, spatial }`                                                                |
| `categories`    |          | `[{ id, label }]`                                                                             |
| `memories`      |          | see below                                                                                     |
| `timeline`      |          | `[{ id, title, date?, description?, image?, memoryId? }]`                                     |
| `nicknames`     |          | `[{ id, name, kind, date?, explanation?, image?, memoryId? }]`                                |
| `messages`      |          | `[{ id, kind, title?, body, signature?, reveal }]`                                            |
| `scenes`        | yes      | ordered list, at least one                                                                    |

## Images

```ts
assets: {
  images: {
    'primer-dia': {
      src: 'photos/primer-dia.webp',       // relative to public/experiences/<slug>/
      alt: 'Isa riendo frente a la pantalla',
      width: 1600, height: 1200,           // reserves space, no layout shift
      focalPoint: { x: 40, y: 35 },        // % — keeps faces in frame when cropped
      caption: 'El día que todo empezó',
      priority: 'auto',                    // 'high' for the first visible photo
    },
  },
},
```

`npm run photos -- <slug>` prints these entries with real dimensions for every file in
the photos folder. Portrait, landscape and square images keep their own proportions.

## Memories

```ts
{
  id: 'primera-partida',
  title: 'Nuestra primera partida',
  date: { precision: 'month', year: 2021, month: 6 },
  category: 'gaming',
  description: 'El juego, el equipo, el momento.',
  message: 'Una frase corta solo para ella.',   // handwritten-style note
  photos: ['partida-1', 'partida-2'],           // gallery order
  tags: ['noche', 'risas'],
  location: 'Online',
}
```

Dates can be `{ precision: 'day', date: 'YYYY-MM-DD' }`, `'month'`, `'year'`, or
`{ precision: 'approximate', label: 'Verano de 2020', sortKey?: '2020-07' }`, or omitted.
`placeholder: true` marks content still to be written (a small badge appears in dev).

## Messages and reveal styles

`kind`: `short`, `letter`, `quote`, `dedication`, `birthday`, `closing`.
`reveal`: `none`, `fade`, `words`, `lines`, `handwritten`, `light-sweep`.
Paragraphs are separated by a blank line (`\n\n`). Word reveals never take longer than a
few seconds regardless of length, and reading mode / reduced motion show text at once.

## Scenes

Every scene has `id`, `type` and optionally `title`, `subtitle`, `navLabel`, `theme`,
`particles` (`none`, `quiet`, `cosmic`, `garden`, `celebration`, `memoryReveal`),
`music` (track id; `null` fades out; omitted keeps the current track), `transition`
(`crossfade`, `rise`, `bloom`, `none`) and `description` (read to screen-reader users).

| `type`          | Specific fields                                                                  |
| --------------- | -------------------------------------------------------------------------------- |
| `arrival`       | `lines[]`, `invitation`, `audioPrompt? { question, accept, decline }`            |
| `memories`      | `memoryIds?` (default all), `intro?`                                             |
| `tree`          | `memoryIds?`, `prompt?`, `seed?` (changes the tree's shape)                      |
| `constellation` | `memoryIds?`, `prompt?`, `positions? { [memoryId]: { x, y } }`, `seed?`          |
| `timeline`      | `eventIds?`, `intro?`                                                            |
| `names`         | `nicknameIds?`, `intro?`                                                         |
| `message`       | `messageId`                                                                      |
| `celebration`   | `headline`, `name?`, `messageId?`, `palette?[]`, `pacing?` (0.25–3)              |
| `closing`       | `messageId?`, `actions?` (`replay`, `memories`, `tree`, `letter`, `celebration`) |

Themes: `cosmic-night`, `memory-garden`, `golden-hour`, `birthday-finale`, `quiet-ending`.

## Audio

```ts
audio: {
  tracks: {
    night: { source: 'generative', preset: 'night-pad' },      // synthesised, no file
    song:  { source: 'file', src: 'audio/cancion.mp3', kind: 'music',
             volume: 0.8, loop: true, credit: 'Artista — CC BY 4.0' },
  },
  effects: true,   // synthesised chimes on interactions
  spatial: true,   // gentle stereo placement of effects
},
```

Only use music you are allowed to publish. Missing files fail silently.

## Privacy

Everything in these files and folders is published. Include only what the recipient
would be comfortable seeing on the open web; see `docs/DEPLOYMENT.md` → Limitations.

## Schema changes

The schema is versioned (`schemaVersion`). Breaking changes bump it and the MAJOR
version, with migration notes in `CHANGELOG.md`.
