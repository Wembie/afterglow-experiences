/**
 * Build-time deployment settings for AFTERGLOW.
 *
 * Everything here is read from environment variables at BUILD time and ends up
 * in a public static bundle. Never put secrets in these variables.
 */
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export interface AfterglowBuildEnv {
  /** Public base path the site is served from: "/name/", "/" or "./" (relative). */
  basePath: string;
  /** Experience opened when the URL has no hash route. */
  defaultExperience: string | null;
  /** Experience slugs bundled into this build. */
  experiences: string[];
  siteTitle: string;
  siteDescription: string;
  /** Absolute public URL (e.g. https://wembie.github.io/mejoramigaisa/), used for social metadata. */
  siteUrl: string | null;
  /** Share image path relative to the site root, or absolute URL. */
  ogImage: string | null;
  themeColor: string;
}

type Env = Record<string, string | undefined>;

/**
 * Normalises a user supplied path such as "mejoramigaisa", "/mejoramigaisa" or
 * "https://wembie.github.io/mejoramigaisa" into "/mejoramigaisa/".
 * An empty value produces "./" (relative base), which works under any path
 * because the app uses hash routing.
 */
export function normalizeBasePath(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (value === '' || value === '.' || value === './') return './';
  if (/^[A-Za-z]:[\\/]/.test(value)) {
    throw new Error(
      `AFTERGLOW_BASE_PATH looks like a file system path ("${value}"). Git Bash on Windows rewrites ` +
        `values that start with "/". Write it without the leading slash (e.g. "mejoramigaisa") ` +
        `or set MSYS_NO_PATHCONV=1.`,
    );
  }
  let path = value;
  if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  const segments = path.split('/').filter(Boolean);
  for (const segment of segments) {
    if (!/^[A-Za-z0-9._~-]+$/.test(segment)) {
      throw new Error(
        `AFTERGLOW_BASE_PATH segment "${segment}" is not URL-safe. Use letters, numbers, "-", "_", "." or "~".`,
      );
    }
  }
  return segments.length === 0 ? '/' : `/${segments.join('/')}/`;
}

export function listExperienceSlugs(experiencesDir: string): string[] {
  if (!existsSync(experiencesDir)) return [];
  return readdirSync(experiencesDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && existsSync(resolve(experiencesDir, entry.name, 'experience.ts')),
    )
    .map((entry) => entry.name)
    .sort();
}

export function readAfterglowEnv(env: Env, available: string[]): AfterglowBuildEnv {
  const requested = (env.AFTERGLOW_EXPERIENCES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const slug of requested) {
    if (!available.includes(slug)) {
      throw new Error(
        `AFTERGLOW_EXPERIENCES lists "${slug}" but src/experiences/${slug}/experience.ts does not exist. Available: ${available.join(', ')}`,
      );
    }
  }
  const experiences = requested.length > 0 ? requested : available;

  const defaultRaw = env.AFTERGLOW_DEFAULT_EXPERIENCE?.trim() || null;
  if (defaultRaw && !experiences.includes(defaultRaw)) {
    throw new Error(
      `AFTERGLOW_DEFAULT_EXPERIENCE "${defaultRaw}" is not part of this build (${experiences.join(', ')}).`,
    );
  }
  // A single bundled experience is the obvious default.
  const defaultExperience =
    defaultRaw ?? (experiences.length === 1 ? (experiences[0] ?? null) : null);

  const siteUrlRaw = env.AFTERGLOW_SITE_URL?.trim() || null;
  const siteUrl = siteUrlRaw ? (siteUrlRaw.endsWith('/') ? siteUrlRaw : `${siteUrlRaw}/`) : null;

  // When only the site URL is given, its path is the base path.
  const baseRaw = env.AFTERGLOW_BASE_PATH?.trim()
    ? env.AFTERGLOW_BASE_PATH
    : (siteUrl ?? undefined);

  return {
    basePath: normalizeBasePath(baseRaw),
    defaultExperience,
    experiences,
    siteTitle: env.AFTERGLOW_SITE_TITLE?.trim() || 'Afterglow',
    siteDescription:
      env.AFTERGLOW_SITE_DESCRIPTION?.trim() || 'Every memory leaves a little light behind.',
    siteUrl,
    ogImage: env.AFTERGLOW_OG_IMAGE?.trim() || 'og-image.png',
    themeColor: env.AFTERGLOW_THEME_COLOR?.trim() || '#090B18',
  };
}
