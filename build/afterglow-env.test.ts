import { describe, expect, it } from 'vitest';
import { normalizeBasePath, readAfterglowEnv } from './afterglow-env';
import { buildHeadTags } from './afterglow-plugin';

describe('normalizeBasePath', () => {
  it.each([
    [undefined, './'],
    ['', './'],
    ['./', './'],
    ['/', '/'],
    ['mejoramigaisa', '/mejoramigaisa/'],
    ['/mejoramigaisa', '/mejoramigaisa/'],
    ['/mejoramigaisa/', '/mejoramigaisa/'],
    ['https://wembie.github.io/mejoramigaisa', '/mejoramigaisa/'],
    ['afterglow-experiences/isa', '/afterglow-experiences/isa/'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeBasePath(input)).toBe(expected);
  });

  it('rejects unsafe segments', () => {
    expect(() => normalizeBasePath('/mi amiga/')).toThrow(/not URL-safe/);
  });

  it('explains Git Bash path rewriting', () => {
    expect(() => normalizeBasePath('C:/Program Files/Git/mejoramigaisa/')).toThrow(/Git Bash/);
  });
});

describe('readAfterglowEnv', () => {
  const available = ['friend-example', 'isa'];

  it('bundles every experience and a relative base by default', () => {
    const env = readAfterglowEnv({}, available);
    expect(env.experiences).toEqual(available);
    expect(env.basePath).toBe('./');
    expect(env.defaultExperience).toBeNull();
  });

  it('uses the only bundled experience as the default', () => {
    const env = readAfterglowEnv({ AFTERGLOW_EXPERIENCES: 'isa' }, available);
    expect(env.experiences).toEqual(['isa']);
    expect(env.defaultExperience).toBe('isa');
  });

  it('derives the base path from the public site URL', () => {
    const env = readAfterglowEnv(
      { AFTERGLOW_SITE_URL: 'https://wembie.github.io/mejoramigaisa' },
      available,
    );
    expect(env.basePath).toBe('/mejoramigaisa/');
    expect(env.siteUrl).toBe('https://wembie.github.io/mejoramigaisa/');
  });

  it('lets an explicit base path win over the site URL', () => {
    const env = readAfterglowEnv(
      { AFTERGLOW_SITE_URL: 'https://wembie.github.io/x', AFTERGLOW_BASE_PATH: 'isa' },
      available,
    );
    expect(env.basePath).toBe('/isa/');
  });

  it('rejects unknown experiences and defaults outside the build', () => {
    expect(() => readAfterglowEnv({ AFTERGLOW_EXPERIENCES: 'nobody' }, available)).toThrow();
    expect(() =>
      readAfterglowEnv(
        { AFTERGLOW_EXPERIENCES: 'isa', AFTERGLOW_DEFAULT_EXPERIENCE: 'friend-example' },
        available,
      ),
    ).toThrow();
  });
});

describe('buildHeadTags', () => {
  it('escapes values and resolves the share image against the site URL', () => {
    const env = readAfterglowEnv(
      {
        AFTERGLOW_SITE_TITLE: 'Para "Isa" <3',
        AFTERGLOW_SITE_URL: 'https://wembie.github.io/mejoramigaisa/',
      },
      ['isa'],
    );
    const html = buildHeadTags(env).join('\n');
    expect(html).toContain('<title>Para &quot;Isa&quot; &lt;3</title>');
    expect(html).toContain('content="https://wembie.github.io/mejoramigaisa/og-image.png"');
    expect(html).toContain('noindex');
  });
});
