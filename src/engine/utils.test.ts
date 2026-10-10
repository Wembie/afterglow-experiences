import { describe, expect, it } from 'vitest';
import { assetUrl } from './assets';
import { dateMarker, dateSortKey, formatDate } from './dates';
import { buildHash, parseHash } from './router';
import { effectiveMusic } from './scenes';
import { format, resolveStrings } from './strings';
import type { SceneDefinition } from './schema';

describe('router', () => {
  it('parses hashes', () => {
    expect(parseHash('')).toEqual({ slug: null, sceneId: null });
    expect(parseHash('#/')).toEqual({ slug: null, sceneId: null });
    expect(parseHash('#/isa')).toEqual({ slug: 'isa', sceneId: null });
    expect(parseHash('#/isa/arbol')).toEqual({ slug: 'isa', sceneId: 'arbol' });
    expect(parseHash('#/isa/arbol?x=1')).toEqual({ slug: 'isa', sceneId: 'arbol' });
  });

  it('round-trips encoded segments', () => {
    expect(parseHash(buildHash('isa', 'cumpleaños'))).toEqual({
      slug: 'isa',
      sceneId: 'cumpleaños',
    });
  });
});

describe('assetUrl', () => {
  it('resolves under any base path', () => {
    expect(assetUrl('isa', 'photos/a.webp', '/mejoramigaisa/')).toBe(
      '/mejoramigaisa/experiences/isa/photos/a.webp',
    );
    expect(assetUrl('isa', './photos/a.webp', './')).toBe('./experiences/isa/photos/a.webp');
    expect(assetUrl('isa', '/photos/a.webp', '/')).toBe('/experiences/isa/photos/a.webp');
  });

  it('leaves absolute URLs untouched', () => {
    expect(assetUrl('isa', 'https://example.com/a.jpg', '/x/')).toBe('https://example.com/a.jpg');
  });
});

describe('dates', () => {
  it('formats each precision', () => {
    expect(formatDate({ precision: 'day', date: '2021-03-05' }, 'es')).toBe('5 de marzo de 2021');
    expect(formatDate({ precision: 'month', year: 2021, month: 3 }, 'en')).toBe('March 2021');
    expect(formatDate({ precision: 'year', year: 2019 }, 'es')).toBe('2019');
    expect(formatDate({ precision: 'approximate', label: 'Hace mucho' }, 'es')).toBe('Hace mucho');
    expect(formatDate(undefined, 'es')).toBeNull();
  });

  it('sorts undated items last and exposes year markers', () => {
    expect(dateSortKey(undefined) > dateSortKey({ precision: 'year', year: 2030 })).toBe(true);
    expect(dateMarker({ precision: 'day', date: '2020-01-02' })).toBe('2020');
  });
});

describe('strings', () => {
  it('merges overrides over the locale defaults', () => {
    const s = resolveStrings('es-CO', { next: 'Sigue' });
    expect(s.next).toBe('Sigue');
    expect(s.previous).toBe('Atrás');
    expect(resolveStrings('fr', {}).previous).toBe('Back');
  });

  it('formats placeholders', () => {
    expect(format('Foto {current} de {total}', { current: 1, total: 3 })).toBe('Foto 1 de 3');
  });
});

describe('effectiveMusic', () => {
  const scenes = [
    { id: 'a', music: 'night' },
    { id: 'b' },
    { id: 'c', music: null },
    { id: 'd' },
  ] as unknown as SceneDefinition[];

  it('carries the last declared track forward', () => {
    expect(effectiveMusic(scenes, 0)).toBe('night');
    expect(effectiveMusic(scenes, 1)).toBe('night');
    expect(effectiveMusic(scenes, 2)).toBeNull();
    expect(effectiveMusic(scenes, 3)).toBeNull();
  });
});
