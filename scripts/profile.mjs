#!/usr/bin/env node
/**
 * Deployment profiles: one small .env-style file per published experience,
 * in deployments/<name>.env. A profile decides the public URL, which
 * experiences are bundled and where the build is published.
 *
 *   node scripts/profile.mjs list                 → JSON array of profile names
 *   node scripts/profile.mjs show isa             → resolved settings
 *   node scripts/profile.mjs check isa            → verifies URL and publishing target agree
 *   node scripts/profile.mjs github-env isa       → appends to $GITHUB_ENV (CI)
 *   node scripts/profile.mjs run isa -- npm run build
 *
 * Profiles hold public settings only. Never put tokens or secrets in them.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const DIR = resolve(import.meta.dirname, '..', 'deployments');
const ALLOWED = /^(AFTERGLOW_[A-Z_]+|PAGES_TARGET_(REPO|BRANCH|DIR))$/;
const SECRET_LIKE = /(TOKEN|SECRET|PASSWORD|KEY)/;

export function parseProfile(text, name = 'profile') {
  const env = {};
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq < 1) throw new Error(`${name}:${i + 1}: expected KEY=value`);
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    if (!ALLOWED.test(key) || SECRET_LIKE.test(key)) {
      throw new Error(`${name}:${i + 1}: "${key}" is not an allowed public setting`);
    }
    env[key] = value;
  });
  return env;
}

export function listProfiles() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.env') && !f.startsWith('_'))
    .map((f) => basename(f, '.env'))
    .sort();
}

export function loadProfile(name) {
  const file = resolve(DIR, `${name}.env`);
  if (!existsSync(file)) {
    throw new Error(
      `No deployment profile "${name}". Available: ${listProfiles().join(', ') || '(none)'}`,
    );
  }
  return parseProfile(readFileSync(file, 'utf8'), `deployments/${name}.env`);
}

function pathOf(env) {
  const raw = env.AFTERGLOW_BASE_PATH || env.AFTERGLOW_SITE_URL || '';
  const path = /^https?:\/\//i.test(raw) ? new URL(raw).pathname : raw;
  const segments = path.split('/').filter(Boolean);
  return segments.length ? `/${segments.join('/')}/` : '/';
}

/**
 * GitHub Pages serves a project repository at /<repo>/ and a user site
 * repository (<owner>.github.io) at /. The base path must match where the
 * files will actually be served, or every asset 404s.
 */
export function checkProfile(env, currentRepo = process.env.GITHUB_REPOSITORY ?? '') {
  const base = pathOf(env);
  const target = env.PAGES_TARGET_REPO || currentRepo;
  const repoName = target.split('/')[1] ?? '';
  const isUserSite = /\.github\.io$/i.test(repoName);
  const dir = (env.PAGES_TARGET_DIR ?? '').replace(/^\/+|\/+$/g, '');
  const served = `/${[isUserSite ? '' : repoName, dir].filter(Boolean).join('/')}/`.replace(
    '//',
    '/',
  );
  const problems = [];
  if (!env.AFTERGLOW_SITE_URL) problems.push('AFTERGLOW_SITE_URL is not set.');
  if (!target) problems.push('No publishing target (PAGES_TARGET_REPO or GITHUB_REPOSITORY).');
  else if (served !== base) {
    problems.push(
      `The site is configured for "${base}" but ${target}${dir ? ` (folder ${dir})` : ''} is served at "${served}". ` +
        (env.PAGES_TARGET_REPO
          ? `Rename the target repository or adjust AFTERGLOW_SITE_URL.`
          : `Set PAGES_TARGET_REPO to a repository named "${base.split('/').filter(Boolean).pop() ?? ''}", or give this repository its own custom domain and set AFTERGLOW_BASE_PATH=/.`),
    );
  }
  return { base, target, served, problems };
}

function main(argv) {
  const [command, name, ...rest] = argv;
  switch (command) {
    case 'list':
      console.log(JSON.stringify(listProfiles()));
      return 0;
    case 'show':
      console.log(JSON.stringify(loadProfile(name), null, 2));
      return 0;
    case 'check': {
      const result = checkProfile(loadProfile(name));
      console.log(`base path: ${result.base}`);
      console.log(`target:    ${result.target || '(none)'}`);
      console.log(`served at: ${result.served}`);
      if (result.problems.length) {
        console.error(result.problems.map((p) => `✗ ${p}`).join('\n'));
        return 1;
      }
      console.log('✓ URL and publishing target agree');
      return 0;
    }
    case 'plan': {
      // Splits profiles into those published to another repository and the (at
      // most one) published from this repository. "-" means "no profile":
      // a default build of every experience for this repository.
      const wanted = name
        ? name
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : listProfiles();
      const external = [];
      const here = [];
      for (const profile of wanted) {
        (loadProfile(profile).PAGES_TARGET_REPO ? external : here).push(profile);
      }
      if (here.length > 1) {
        throw new Error(
          `Only one profile can publish from this repository; set PAGES_TARGET_REPO in all but one of: ${here.join(', ')}`,
        );
      }
      if (wanted.length === 0) here.push('-');
      console.log(JSON.stringify({ external, here }));
      return 0;
    }
    case 'github-env': {
      if (name === '-') return 0;
      const target = process.env.GITHUB_ENV;
      if (!target) throw new Error('GITHUB_ENV is not set (this command is for GitHub Actions).');
      const env = loadProfile(name);
      for (const [key, value] of Object.entries(env)) {
        if (/[\r\n]/.test(value)) throw new Error(`${key} must be a single line`);
        appendFileSync(target, `${key}=${value}\n`);
      }
      return 0;
    }
    case 'run': {
      const cmd = rest[0] === '--' ? rest.slice(1) : rest;
      if (cmd.length === 0) throw new Error('Usage: profile.mjs run <name> -- <command...>');
      const result = spawnSync(cmd[0], cmd.slice(1), {
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: { ...process.env, ...loadProfile(name) },
      });
      return result.status ?? 1;
    }
    default:
      console.error('Usage: profile.mjs <list|show|check|github-env|run> [name] [-- command]');
      return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
