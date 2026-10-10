import { describe, expect, it } from 'vitest';
import friend from '../experiences/friend-example/experience';
import isa from '../experiences/isa/experience';
import { minimalExperience } from '../test/fixtures';
import { validateExperience } from './validate';

describe('validateExperience', () => {
  it.each([
    ['isa', isa],
    ['friend-example', friend],
  ])('accepts the bundled "%s" experience', (_name, input) => {
    const result = validateExperience(input);
    if (!result.ok) throw new Error(result.errors.join('\n'));
    expect(result.experience.scenes.length).toBeGreaterThan(0);
  });

  it('fills in defaults for optional fields', () => {
    const result = validateExperience(minimalExperience());
    if (!result.ok) throw new Error(result.errors.join('\n'));
    const exp = result.experience;
    expect(exp.locale).toBe('es');
    expect(exp.theme.base).toBe('cosmic-night');
    expect(exp.navigation).toEqual({ showProgress: true, showSceneIndex: true });
    expect(exp.memories[0]?.photos).toEqual([]);
    expect(exp.memories[0]?.placeholder).toBe(false);
    expect(exp.scenes[0]?.transition).toBe('crossfade');
    expect(exp.audio.effects).toBe(true);
  });

  it('rejects broken references with readable paths', () => {
    const input = minimalExperience();
    input.memories = [{ id: 'm1', title: 'Uno', photos: ['missing-image'] }];
    input.scenes.push({ id: 'letter', type: 'message', messageId: 'nope' });
    const result = validateExperience(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain('memories.0.photos.0: unknown image "missing-image"');
    expect(result.errors).toContain('scenes.1.messageId: unknown message "nope"');
  });

  it('rejects duplicate ids', () => {
    const input = minimalExperience();
    input.scenes.push({ ...input.scenes[0]! });
    expect(validateExperience(input).ok).toBe(false);
  });

  it('rejects unknown scene types, wrong versions and non-objects', () => {
    const unknownScene = minimalExperience() as unknown as { scenes: unknown[] };
    unknownScene.scenes.push({ id: 'x', type: 'karaoke' });
    expect(validateExperience(unknownScene).ok).toBe(false);
    expect(validateExperience({ ...minimalExperience(), schemaVersion: 2 }).ok).toBe(false);
    expect(validateExperience(null).ok).toBe(false);
  });
});
