import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import type { AfterglowBuildEnv } from './afterglow-env.ts';

const VIRTUAL_ID = 'virtual:afterglow-experiences';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildHeadTags(env: AfterglowBuildEnv): string[] {
  let ogImage: string | null = null;
  if (env.ogImage) {
    if (/^https?:\/\//.test(env.ogImage)) ogImage = env.ogImage;
    else if (env.siteUrl) ogImage = new URL(env.ogImage, env.siteUrl).toString();
  }
  return [
    `<title>${escapeHtml(env.siteTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(env.siteDescription)}" />`,
    `<meta name="theme-color" content="${escapeHtml(env.themeColor)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(env.siteTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(env.siteDescription)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    env.siteUrl ? `<meta property="og:url" content="${escapeHtml(env.siteUrl)}" />` : '',
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : '',
    // Personal experiences should not show up in search engines by default.
    `<meta name="robots" content="noindex, nofollow" />`,
  ].filter(Boolean);
}

/**
 * - Exposes only the selected experiences through a virtual module, so content
 *   for other recipients is never emitted into this build.
 * - Removes public assets of experiences that are not part of the build.
 * - Injects deployment metadata into index.html.
 */
export function afterglowPlugin(env: AfterglowBuildEnv): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'afterglow',
    configResolved(resolved) {
      config = resolved;
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const entries = env.experiences
        .map(
          (slug) =>
            `  ${JSON.stringify(slug)}: () => import('/src/experiences/${slug}/experience.ts').then((m) => m.default),`,
        )
        .join('\n');
      return [
        `export const experienceLoaders = {\n${entries}\n};`,
        `export const defaultExperience = ${JSON.stringify(env.defaultExperience)};`,
      ].join('\n');
    },
    transformIndexHtml(html) {
      return html.replace('<!--afterglow:head-->', buildHeadTags(env).join('\n    '));
    },
    closeBundle() {
      if (config.command !== 'build') return;
      const dir = resolve(config.root, config.build.outDir, 'experiences');
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && !env.experiences.includes(entry.name)) {
          rmSync(resolve(dir, entry.name), { recursive: true, force: true });
        }
      }
    },
  };
}
