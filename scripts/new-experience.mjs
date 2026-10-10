#!/usr/bin/env node
/**
 * Scaffolds a new experience without touching the engine.
 *
 *   npm run new-experience -- <slug> "<Recipient name>" [--locale en] [--path <url-path>]
 *
 * Creates:
 *   src/experiences/<slug>/experience.ts   (content, scenes, messages)
 *   public/experiences/<slug>/photos/      (images)
 *   public/experiences/<slug>/audio/       (music you are allowed to publish)
 *   deployments/_<slug>.env                (public URL + target; rename to <slug>.env when ready)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const [, value] = args.splice(i, 2);
  return value;
};
const locale = flag('locale') ?? 'es';
const urlPath = flag('path');
const [slug, recipient] = args;

if (!slug || !/^[a-z0-9-]+$/.test(slug) || !recipient) {
  console.error(
    'Usage: npm run new-experience -- <slug> "<Recipient name>" [--locale en] [--path <url-path>]',
  );
  console.error('The slug may contain lowercase letters, numbers and dashes.');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const sourceDir = resolve(root, 'src/experiences', slug);
if (existsSync(sourceDir)) {
  console.error(`src/experiences/${slug} already exists.`);
  process.exit(1);
}

const es = locale.startsWith('es');
const t = (spanish, english) => (es ? spanish : english);
const q = (s) => JSON.stringify(s);

mkdirSync(sourceDir, { recursive: true });
mkdirSync(resolve(root, 'public/experiences', slug, 'photos'), { recursive: true });
mkdirSync(resolve(root, 'public/experiences', slug, 'audio'), { recursive: true });
writeFileSync(resolve(root, 'public/experiences', slug, 'photos/.gitkeep'), '');
writeFileSync(resolve(root, 'public/experiences', slug, 'audio/.gitkeep'), '');

writeFileSync(
  resolve(sourceDir, 'experience.ts'),
  `import { defineExperience } from '../../engine/define';

export default defineExperience({
  schemaVersion: 1,
  id: ${q(slug)},
  slug: ${q(slug)},
  locale: ${q(locale)},
  meta: { title: ${q(recipient)} },
  recipient: { name: ${q(recipient)} },
  occasion: { type: 'celebration', title: ${q(t('Un pequeño universo', 'A little universe'))} },
  relationship: { type: 'friendship' },
  theme: { base: 'cosmic-night' },
  assets: {
    // Run \`npm run photos -- ${slug}\` after adding photos to get these entries.
    images: {},
  },
  audio: {
    tracks: { night: { source: 'generative', preset: 'night-pad' } },
  },
  memories: [
    {
      id: 'first',
      title: ${q(t('Un primer recuerdo', 'A first memory'))},
      description: ${q(t('Escribe aquí el recuerdo.', 'Write the memory here.'))},
      placeholder: true,
    },
  ],
  messages: [
    {
      id: 'letter',
      kind: 'letter',
      body: ${q(t('Tu carta va aquí.', 'Your letter goes here.'))},
      reveal: 'fade',
      placeholder: true,
    },
  ],
  scenes: [
    {
      id: 'arrival',
      type: 'arrival',
      music: 'night',
      lines: [${q(t('Algunas personas se vuelven parte de nuestras historias favoritas.', 'Some people become part of our favorite stories.'))}],
      invitation: ${q(t('Entrar', 'Come in'))},
      audioPrompt: {
        question: ${q(t('¿Activamos la música?', 'Turn on the music?'))},
        accept: ${q(t('Sí', 'Yes'))},
        decline: ${q(t('En silencio', 'Stay silent'))},
      },
    },
    { id: 'memories', type: 'memories', title: ${q(t('Recuerdos', 'Memories'))}, theme: 'golden-hour' },
    { id: 'tree', type: 'tree', title: ${q(t('El árbol', 'The tree'))}, theme: 'memory-garden' },
    { id: 'letter', type: 'message', messageId: 'letter', theme: 'quiet-ending' },
    { id: 'closing', type: 'closing', title: ${q(t('Gracias', 'Thank you'))}, actions: ['replay', 'tree'] },
  ],
});
`,
);

// Starts with "_" so CI ignores it until the placeholders are filled and it is renamed.
const profile = resolve(root, 'deployments', `_${slug}.env`);
if (!existsSync(profile)) {
  const path = urlPath ?? slug;
  writeFileSync(
    profile,
    `# Deployment profile for "${slug}". Everything here is PUBLIC.
AFTERGLOW_SITE_URL=https://<your-pages-domain>/${path}
AFTERGLOW_EXPERIENCES=${slug}
AFTERGLOW_SITE_TITLE=${recipient}

# Publish to a repository named "${path}" (served at /${path}/):
PAGES_TARGET_REPO=<owner>/${path}
PAGES_TARGET_BRANCH=gh-pages
`,
  );
}

console.log(`Created experience "${slug}".

Next:
  1. Edit src/experiences/${slug}/experience.ts
  2. Add photos to public/experiences/${slug}/photos and run: npm run photos -- ${slug}
  3. Preview: npm run dev  →  http://localhost:5173/#/${slug}
  4. Fill in deployments/_${slug}.env, rename it to ${slug}.env, then: node scripts/profile.mjs check ${slug}`);
