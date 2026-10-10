/**
 * The AFTERGLOW experience schema.
 *
 * Every experience is plain data validated against this schema before anything
 * renders. Types are inferred from the schema so the two can never drift.
 * Bump SCHEMA_VERSION (and document a migration in CHANGELOG.md) on breaking changes.
 */
import { z } from 'zod';

export const SCHEMA_VERSION = 1;

const id = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-_]*$/i, 'ids may contain letters, numbers, "-" and "_"');

const nonEmpty = z.string().trim().min(1);

// ---------------------------------------------------------------------------
// Themes, particles, motion
// ---------------------------------------------------------------------------

export const themeNames = [
  'cosmic-night',
  'memory-garden',
  'golden-hour',
  'birthday-finale',
  'quiet-ending',
] as const;
export const themeName = z.enum(themeNames);

export const particlePresetNames = [
  'none',
  'quiet',
  'cosmic',
  'garden',
  'celebration',
  'memoryReveal',
] as const;
export const particlePresetName = z.enum(particlePresetNames);

export const sceneTransition = z.enum(['crossfade', 'rise', 'bloom', 'none']);

export const revealStyle = z.enum(['none', 'fade', 'words', 'lines', 'handwritten', 'light-sweep']);

// ---------------------------------------------------------------------------
// Dates — creators often only remember roughly when something happened.
// ---------------------------------------------------------------------------

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use YYYY-MM-DD');

export const dateValue = z.discriminatedUnion('precision', [
  z.object({ precision: z.literal('day'), date: isoDate }),
  z.object({
    precision: z.literal('month'),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
  }),
  z.object({ precision: z.literal('year'), year: z.number().int() }),
  z.object({
    precision: z.literal('approximate'),
    /** Free text such as "Summer 2021" or "Hace mucho". */
    label: nonEmpty,
    /** Optional ISO-ish key used only for ordering, e.g. "2021-07". */
    sortKey: z.string().optional(),
  }),
]);

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export const imageAsset = z.object({
  /** Path relative to public/experiences/<slug>/, or an absolute https URL. */
  src: nonEmpty,
  /** Required: every image must be describable to screen-reader users. */
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /** Percentages used for object-position so faces stay in frame. */
  focalPoint: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
  caption: z.string().optional(),
  priority: z.enum(['high', 'auto']).default('auto'),
});

export const audioTrack = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('file'),
    /** Path relative to public/experiences/<slug>/. MP3 or OGG/Opus recommended. */
    src: nonEmpty,
    kind: z.enum(['music', 'ambient']).default('music'),
    loop: z.boolean().default(true),
    volume: z.number().min(0).max(1).default(1),
    /** Shown in the audio panel; credit the author when the license requires it. */
    credit: z.string().optional(),
  }),
  z.object({
    /** Synthesised in the browser: no file, no licensing concerns. */
    source: z.literal('generative'),
    preset: z.enum(['night-pad', 'garden-pad', 'warm-pad']),
    kind: z.enum(['music', 'ambient']).default('ambient'),
    volume: z.number().min(0).max(1).default(0.6),
  }),
]);

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const memory = z.object({
  id,
  title: nonEmpty,
  date: dateValue.optional(),
  description: z.string().optional(),
  /** Image ids from assets.images, in gallery order. */
  photos: z.array(id).default([]),
  category: id.optional(),
  tags: z.array(z.string()).default([]),
  /** A personal note shown when the memory is opened. */
  message: z.string().optional(),
  location: z.string().optional(),
  theme: themeName.optional(),
  /** Marks content the creator still needs to fill in. Rendered with a subtle badge in dev. */
  placeholder: z.boolean().default(false),
});

export const category = z.object({
  id,
  label: nonEmpty,
});

export const timelineEvent = z.object({
  id,
  title: nonEmpty,
  date: dateValue.optional(),
  description: z.string().optional(),
  image: id.optional(),
  memoryId: id.optional(),
  placeholder: z.boolean().default(false),
});

export const nickname = z.object({
  id,
  name: nonEmpty,
  kind: z.enum(['nickname', 'username', 'former-username', 'alias', 'phrase', 'inside-joke']),
  date: dateValue.optional(),
  explanation: z.string().optional(),
  image: id.optional(),
  memoryId: id.optional(),
  placeholder: z.boolean().default(false),
});

export const message = z.object({
  id,
  kind: z.enum(['short', 'letter', 'quote', 'dedication', 'birthday', 'closing']),
  title: z.string().optional(),
  /** Paragraphs are separated by a blank line. */
  body: nonEmpty,
  signature: z.string().optional(),
  reveal: revealStyle.default('fade'),
  placeholder: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

const sceneBase = {
  id,
  title: z.string().optional(),
  subtitle: z.string().optional(),
  theme: themeName.optional(),
  particles: particlePresetName.optional(),
  /** Track id to play when the scene opens. `null` fades music out. Omit to keep the current track. */
  music: id.nullable().optional(),
  transition: sceneTransition.default('crossfade'),
  /** Read by screen readers when the scene opens; describes what is visual-only. */
  description: z.string().optional(),
  /** Label used in the scene index. Falls back to the title. */
  navLabel: z.string().optional(),
};

export const arrivalScene = z.object({
  ...sceneBase,
  type: z.literal('arrival'),
  lines: z.array(nonEmpty).min(1),
  invitation: nonEmpty,
  audioPrompt: z.object({ question: nonEmpty, accept: nonEmpty, decline: nonEmpty }).optional(),
});

export const memoriesScene = z.object({
  ...sceneBase,
  type: z.literal('memories'),
  memoryIds: z.array(id).optional(),
  intro: z.string().optional(),
});

export const treeScene = z.object({
  ...sceneBase,
  type: z.literal('tree'),
  memoryIds: z.array(id).optional(),
  prompt: z.string().optional(),
  /** Changes the procedural tree shape while staying deterministic. */
  seed: z.number().int().optional(),
});

export const constellationScene = z.object({
  ...sceneBase,
  type: z.literal('constellation'),
  memoryIds: z.array(id).optional(),
  prompt: z.string().optional(),
  /** Optional manual placement, in percent of the sky area. */
  positions: z
    .record(z.string(), z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }))
    .optional(),
  seed: z.number().int().optional(),
});

export const timelineScene = z.object({
  ...sceneBase,
  type: z.literal('timeline'),
  eventIds: z.array(id).optional(),
  intro: z.string().optional(),
});

export const namesScene = z.object({
  ...sceneBase,
  type: z.literal('names'),
  nicknameIds: z.array(id).optional(),
  intro: z.string().optional(),
});

export const messageScene = z.object({
  ...sceneBase,
  type: z.literal('message'),
  messageId: id,
});

export const celebrationScene = z.object({
  ...sceneBase,
  type: z.literal('celebration'),
  /** e.g. "Feliz cumpleaños". */
  headline: nonEmpty,
  /** Defaults to the recipient name. */
  name: z.string().optional(),
  messageId: id.optional(),
  /** Celebration particle colours (CSS colours). */
  palette: z.array(z.string()).min(1).optional(),
  /** Multiplier for the finale's phase durations; lower is faster. */
  pacing: z.number().min(0.25).max(3).default(1),
});

export const closingAction = z.enum(['replay', 'memories', 'tree', 'letter', 'celebration']);

export const closingScene = z.object({
  ...sceneBase,
  type: z.literal('closing'),
  messageId: id.optional(),
  actions: z.array(closingAction).default(['replay']),
});

export const sceneDefinition = z.discriminatedUnion('type', [
  arrivalScene,
  memoriesScene,
  treeScene,
  constellationScene,
  timelineScene,
  namesScene,
  messageScene,
  celebrationScene,
  closingScene,
]);

export const sceneTypes = [
  'arrival',
  'memories',
  'tree',
  'constellation',
  'timeline',
  'names',
  'message',
  'celebration',
  'closing',
] as const;

// ---------------------------------------------------------------------------
// UI strings (merged over locale defaults)
// ---------------------------------------------------------------------------

export const uiStrings = z.object({
  next: z.string(),
  previous: z.string(),
  close: z.string(),
  skipIntro: z.string(),
  openMemory: z.string(),
  memoryList: z.string(),
  photoOf: z.string(),
  nextPhoto: z.string(),
  previousPhoto: z.string(),
  sceneIndex: z.string(),
  settings: z.string(),
  sound: z.string(),
  soundOn: z.string(),
  soundOff: z.string(),
  masterVolume: z.string(),
  musicVolume: z.string(),
  effectsVolume: z.string(),
  effects: z.string(),
  motion: z.string(),
  motionSystem: z.string(),
  motionFull: z.string(),
  motionReduced: z.string(),
  quality: z.string(),
  qualityAuto: z.string(),
  qualityHigh: z.string(),
  qualityLow: z.string(),
  readingMode: z.string(),
  replay: z.string(),
  revisitMemories: z.string(),
  returnToTree: z.string(),
  openLetter: z.string(),
  viewCelebration: z.string(),
  continue: z.string(),
  skipAnimation: z.string(),
  missingPhoto: z.string(),
  undated: z.string(),
  progress: z.string(),
  loading: z.string(),
  errorTitle: z.string(),
  errorBody: z.string(),
  explored: z.string(),
});

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

export const experienceSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id,
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers and dashes'),
    /** BCP-47 tag, e.g. "es-CO" or "en". Used for UI strings and date formatting. */
    locale: z.string().default('es'),
    meta: z.object({ title: nonEmpty, description: z.string().optional() }),
    recipient: z.object({ name: nonEmpty }),
    creator: z
      .object({ name: z.string().optional(), signature: z.string().optional() })
      .default({}),
    occasion: z.object({
      type: z.enum([
        'birthday',
        'anniversary',
        'graduation',
        'farewell',
        'milestone',
        'memorial',
        'celebration',
        'custom',
      ]),
      title: nonEmpty,
    }),
    relationship: z.object({
      type: z.enum([
        'friendship',
        'romantic',
        'family',
        'mentor',
        'colleague',
        'community',
        'custom',
      ]),
      label: z.string().optional(),
    }),
    theme: z
      .object({
        /** Theme used by scenes that do not set their own. */
        base: themeName.default('cosmic-night'),
        /** Optional CSS colour overrides for semantic tokens. */
        accents: z
          .object({
            primary: z.string().optional(),
            secondary: z.string().optional(),
            glow: z.string().optional(),
            warm: z.string().optional(),
          })
          .default({}),
      })
      .default({ base: 'cosmic-night', accents: {} }),
    navigation: z
      .object({
        showProgress: z.boolean().default(true),
        showSceneIndex: z.boolean().default(true),
      })
      .default({ showProgress: true, showSceneIndex: true }),
    strings: uiStrings.partial().default({}),
    assets: z
      .object({
        images: z.record(z.string(), imageAsset).default({}),
      })
      .default({ images: {} }),
    audio: z
      .object({
        tracks: z.record(z.string(), audioTrack).default({}),
        /** Synthesised interaction sounds (chimes). No files required. */
        effects: z.boolean().default(true),
        /** Gentle stereo placement of effects near the selected element. */
        spatial: z.boolean().default(true),
      })
      .default({ tracks: {}, effects: true, spatial: true }),
    categories: z.array(category).default([]),
    memories: z.array(memory).default([]),
    timeline: z.array(timelineEvent).default([]),
    nicknames: z.array(nickname).default([]),
    messages: z.array(message).default([]),
    scenes: z.array(sceneDefinition).min(1),
  })
  .superRefine((exp, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });

    const unique = (items: { id: string }[], key: string) => {
      const seen = new Set<string>();
      items.forEach((item, i) => {
        if (seen.has(item.id)) issue([key, i, 'id'], `duplicate id "${item.id}"`);
        seen.add(item.id);
      });
    };
    unique(exp.scenes, 'scenes');
    unique(exp.memories, 'memories');
    unique(exp.timeline, 'timeline');
    unique(exp.nicknames, 'nicknames');
    unique(exp.messages, 'messages');
    unique(exp.categories, 'categories');

    const images = new Set(Object.keys(exp.assets.images));
    const memories = new Set(exp.memories.map((m) => m.id));
    const messages = new Set(exp.messages.map((m) => m.id));
    const events = new Set(exp.timeline.map((e) => e.id));
    const names = new Set(exp.nicknames.map((n) => n.id));
    const categories = new Set(exp.categories.map((c) => c.id));
    const tracks = new Set(Object.keys(exp.audio.tracks));

    const ref = (
      set: Set<string>,
      value: string | undefined,
      path: (string | number)[],
      what: string,
    ) => {
      if (value !== undefined && !set.has(value)) issue(path, `unknown ${what} "${value}"`);
    };

    exp.memories.forEach((m, i) => {
      m.photos.forEach((p, j) => ref(images, p, ['memories', i, 'photos', j], 'image'));
      ref(categories, m.category, ['memories', i, 'category'], 'category');
    });
    exp.timeline.forEach((e, i) => {
      ref(images, e.image, ['timeline', i, 'image'], 'image');
      ref(memories, e.memoryId, ['timeline', i, 'memoryId'], 'memory');
    });
    exp.nicknames.forEach((n, i) => {
      ref(images, n.image, ['nicknames', i, 'image'], 'image');
      ref(memories, n.memoryId, ['nicknames', i, 'memoryId'], 'memory');
    });
    exp.scenes.forEach((s, i) => {
      if (s.music) ref(tracks, s.music, ['scenes', i, 'music'], 'audio track');
      switch (s.type) {
        case 'memories':
        case 'tree':
        case 'constellation':
          s.memoryIds?.forEach((m, j) => ref(memories, m, ['scenes', i, 'memoryIds', j], 'memory'));
          break;
        case 'timeline':
          s.eventIds?.forEach((e, j) =>
            ref(events, e, ['scenes', i, 'eventIds', j], 'timeline event'),
          );
          break;
        case 'names':
          s.nicknameIds?.forEach((n, j) =>
            ref(names, n, ['scenes', i, 'nicknameIds', j], 'nickname'),
          );
          break;
        case 'message':
          ref(messages, s.messageId, ['scenes', i, 'messageId'], 'message');
          break;
        case 'celebration':
        case 'closing':
          ref(messages, s.messageId, ['scenes', i, 'messageId'], 'message');
          break;
        case 'arrival':
          break;
      }
    });
  });

/** What creators write. Fields with defaults are optional here. */
export type ExperienceInput = z.input<typeof experienceSchema>;
/** What the engine renders. Defaults are filled in. */
export type Experience = z.output<typeof experienceSchema>;
export type SceneDefinition = Experience['scenes'][number];
export type SceneType = SceneDefinition['type'];
export type SceneOf<T extends SceneType> = Extract<SceneDefinition, { type: T }>;
export type Memory = Experience['memories'][number];
export type TimelineEvent = Experience['timeline'][number];
export type Nickname = Experience['nicknames'][number];
export type Message = Experience['messages'][number];
export type ImageAsset = z.output<typeof imageAsset>;
export type AudioTrack = z.output<typeof audioTrack>;
export type DateValue = z.output<typeof dateValue>;
export type ThemeName = (typeof themeNames)[number];
export type ParticlePresetName = (typeof particlePresetNames)[number];
export type RevealStyle = z.output<typeof revealStyle>;
export type UiStrings = z.output<typeof uiStrings>;
export type ClosingAction = z.output<typeof closingAction>;
