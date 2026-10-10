import { describe, expect, it, vi } from 'vitest';
import { AudioManager } from './AudioManager';
import type { AudioTrack } from '../engine/schema';

/** Just enough Web Audio to observe what the manager does. */
function fakeAudioContext() {
  const instances: FakeContext[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const node = () => {
    const n = {
      gain: param(),
      frequency: param(),
      detune: param(),
      Q: param(),
      pan: param(),
      type: '',
      connect: vi.fn((target: unknown) => target),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    return n;
  };
  class FakeContext {
    currentTime = 0;
    destination = node();
    createGain = vi.fn(node);
    createOscillator = vi.fn(node);
    createBiquadFilter = vi.fn(node);
    createStereoPanner = vi.fn(node);
    createMediaElementSource = vi.fn(node);
    resume = vi.fn(() => Promise.resolve());
    suspend = vi.fn(() => Promise.resolve());
    close = vi.fn(() => Promise.resolve());
    constructor() {
      instances.push(this);
    }
  }
  return { Ctor: FakeContext as unknown as new () => AudioContext, instances };
}

const tracks: Record<string, AudioTrack> = {
  pad: { source: 'generative', preset: 'night-pad', kind: 'ambient', volume: 0.6 },
  song: { source: 'file', src: 'audio/missing.mp3', kind: 'music', loop: true, volume: 1 },
};

const options = { spatial: true, effects: true };

describe('AudioManager', () => {
  it('creates no AudioContext until a user gesture unlocks it', () => {
    const { Ctor, instances } = fakeAudioContext();
    const manager = new AudioManager(tracks, (s) => s, options, Ctor);
    manager.playMusic('pad');
    manager.playEffect('chime');
    expect(instances).toHaveLength(0);
    expect(manager.getState()).toMatchObject({ status: 'locked', enabled: false });

    expect(manager.unlock()).toBe(true);
    expect(instances).toHaveLength(1);
    // The track requested before the gesture starts now.
    expect(manager.getState()).toMatchObject({
      status: 'ready',
      enabled: true,
      currentTrack: 'pad',
    });
  });

  it('reuses a single context and never duplicates the current track', () => {
    const { Ctor, instances } = fakeAudioContext();
    const manager = new AudioManager(tracks, (s) => s, options, Ctor);
    manager.unlock();
    manager.unlock();
    manager.playMusic('pad');
    const oscillators = instances[0]!.createOscillator.mock.calls.length;
    manager.playMusic('pad');
    expect(instances).toHaveLength(1);
    expect(instances[0]!.createOscillator.mock.calls.length).toBe(oscillators);
  });

  it('mutes by suspending and resumes on unlock', () => {
    const { Ctor, instances } = fakeAudioContext();
    const manager = new AudioManager(tracks, (s) => s, options, Ctor);
    manager.unlock();
    manager.disable();
    expect(manager.getState().enabled).toBe(false);
    expect(instances[0]!.suspend).toHaveBeenCalled();
    manager.playEffect('chime');
    expect(instances[0]!.createStereoPanner).not.toHaveBeenCalled();
    manager.unlock();
    expect(manager.getState().enabled).toBe(true);
  });

  it('applies volume changes to the buses', () => {
    const { Ctor, instances } = fakeAudioContext();
    const manager = new AudioManager(tracks, (s) => s, options, Ctor);
    manager.unlock();
    const [master] = instances[0]!.createGain.mock.results.map((r) => r.value);
    manager.setVolumes({ master: 0.25, music: 0.5, effects: 0.5, effectsEnabled: true });
    expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.25, 0, 0.05);
  });

  it('ignores unknown tracks and survives missing files', async () => {
    const { Ctor } = fakeAudioContext();
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.reject(new Error('404')));
    const manager = new AudioManager(tracks, (s) => s, options, Ctor);
    manager.unlock();
    expect(() => manager.playMusic('does-not-exist')).not.toThrow();
    expect(manager.getState().currentTrack).toBeNull();
    manager.playMusic('song');
    await Promise.resolve();
    await Promise.resolve();
    expect(manager.getState().currentTrack).toBeNull();
    play.mockRestore();
  });

  it('reports unavailable audio and keeps working silently', () => {
    const manager = new AudioManager(tracks, (s) => s, options, null);
    expect(manager.getState().status).toBe('unavailable');
    expect(manager.unlock()).toBe(false);
    expect(() => {
      manager.playMusic('pad');
      manager.playEffect('bloom');
    }).not.toThrow();
  });

  it('places effects in the stereo field, softened for speakers', () => {
    const { Ctor, instances } = fakeAudioContext();
    const manager = new AudioManager(tracks, (s) => s, options, Ctor);
    manager.unlock();
    manager.playEffect('chime', 1);
    const panner = instances[0]!.createStereoPanner.mock.results[0]!.value;
    expect(panner.pan.value).toBeCloseTo(0.6);
  });
});
