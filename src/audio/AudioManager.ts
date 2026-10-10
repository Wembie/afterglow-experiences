/**
 * Centralised audio for an experience.
 *
 * - One AudioContext, created only from a user gesture (`unlock`).
 * - Music/ambient tracks crossfade through a shared music bus.
 * - Interaction effects are synthesised (no files, no licensing), optionally
 *   placed in the stereo field with a StereoPannerNode.
 * - Every failure (missing file, blocked playback, no Web Audio) degrades to silence.
 */
import type { AudioTrack } from '../engine/schema';

export type EffectName = 'chime' | 'bloom' | 'soft' | 'celebrate';

export interface AudioState {
  /** locked: waiting for a gesture; ready: running; unavailable: no Web Audio. */
  status: 'locked' | 'ready' | 'unavailable';
  /** The visitor's choice for this visit. */
  enabled: boolean;
  currentTrack: string | null;
}

export interface Volumes {
  master: number;
  music: number;
  effects: number;
  effectsEnabled: boolean;
}

interface PlayingTrack {
  id: string;
  gain: GainNode;
  stop: () => void;
}

type AudioContextCtor = new () => AudioContext;

const FADE_SECONDS = 1.6;

function defaultContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return (window.AudioContext as AudioContextCtor | undefined) ?? w.webkitAudioContext ?? null;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private effectsBus: GainNode | null = null;
  private current: PlayingTrack | null = null;
  private pendingTrack: string | null = null;
  private volumes: Volumes = { master: 0.8, music: 0.7, effects: 0.6, effectsEnabled: true };
  private state: AudioState;
  private listeners = new Set<() => void>();
  private readonly ContextCtor: AudioContextCtor | null;
  private readonly onVisibility = () => {
    if (!this.ctx || !this.state.enabled) return;
    if (document.hidden) void this.ctx.suspend().catch(() => {});
    else void this.ctx.resume().catch(() => {});
  };

  constructor(
    private readonly tracks: Record<string, AudioTrack>,
    private readonly resolveUrl: (src: string) => string,
    private readonly options: { spatial: boolean; effects: boolean },
    ContextCtor: AudioContextCtor | null = defaultContextCtor(),
  ) {
    this.ContextCtor = ContextCtor;
    this.state = {
      status: ContextCtor ? 'locked' : 'unavailable',
      enabled: false,
      currentTrack: null,
    };
  }

  // -- state ---------------------------------------------------------------

  getState = (): AudioState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private setState(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  // -- lifecycle -----------------------------------------------------------

  /**
   * Must be called synchronously inside a user gesture handler (click/keydown).
   * Returns false when audio is unavailable; the experience continues silently.
   */
  unlock(): boolean {
    if (this.ctx) {
      void this.ctx.resume().catch(() => {});
      this.setState({ enabled: true });
      if (this.pendingTrack) this.playMusic(this.pendingTrack);
      return true;
    }
    if (!this.ContextCtor) {
      this.setState({ status: 'unavailable', enabled: false });
      return false;
    }
    try {
      const ctx = new this.ContextCtor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.musicBus = ctx.createGain();
      this.effectsBus = ctx.createGain();
      this.musicBus.connect(this.master);
      this.effectsBus.connect(this.master);
      this.master.connect(ctx.destination);
      this.applyVolumes();
      void ctx.resume().catch(() => {});
      document.addEventListener('visibilitychange', this.onVisibility);
      this.setState({ status: 'ready', enabled: true });
      if (this.pendingTrack) this.playMusic(this.pendingTrack);
      return true;
    } catch {
      this.ctx = null;
      this.setState({ status: 'unavailable', enabled: false });
      return false;
    }
  }

  /** Visitor turned sound off. Keeps the context so turning it back on is instant. */
  disable(): void {
    this.setState({ enabled: false });
    if (this.ctx) void this.ctx.suspend().catch(() => {});
  }

  dispose(): void {
    this.current?.stop();
    this.current = null;
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.ctx) void this.ctx.close().catch(() => {});
    this.ctx = null;
    this.listeners.clear();
  }

  // -- volume --------------------------------------------------------------

  setVolumes(volumes: Volumes): void {
    this.volumes = volumes;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx || !this.master || !this.musicBus || !this.effectsBus) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.master, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.volumes.music, t, 0.05);
    this.effectsBus.gain.setTargetAtTime(
      this.volumes.effectsEnabled ? this.volumes.effects : 0,
      t,
      0.05,
    );
  }

  // -- music ---------------------------------------------------------------

  /** Crossfades to a track. `null` fades out. Unknown or broken tracks are ignored. */
  playMusic(trackId: string | null): void {
    this.pendingTrack = trackId;
    if (trackId === this.current?.id) return;
    if (!this.ctx || !this.musicBus || !this.state.enabled) return;

    const previous = this.current;
    this.current = null;
    previous?.stop();

    if (trackId === null) {
      this.setState({ currentTrack: null });
      return;
    }
    const track = this.tracks[trackId];
    if (!track) {
      this.setState({ currentTrack: null });
      return;
    }
    try {
      this.current =
        track.source === 'file'
          ? this.startFileTrack(trackId, track)
          : this.startGenerativeTrack(trackId, track);
      this.setState({ currentTrack: trackId });
    } catch {
      this.current = null;
      this.setState({ currentTrack: null });
    }
  }

  private fadeIn(gain: GainNode, target: number) {
    const ctx = this.ctx!;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + FADE_SECONDS);
  }

  private fadeOutThen(gain: GainNode, done: () => void) {
    const ctx = this.ctx;
    if (!ctx) return done();
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + FADE_SECONDS);
    window.setTimeout(done, FADE_SECONDS * 1000 + 50);
  }

  private startFileTrack(id: string, track: Extract<AudioTrack, { source: 'file' }>): PlayingTrack {
    const ctx = this.ctx!;
    const element = new Audio();
    element.src = this.resolveUrl(track.src);
    element.loop = track.loop;
    element.preload = 'auto';
    const gain = ctx.createGain();
    const source = ctx.createMediaElementSource(element);
    source.connect(gain).connect(this.musicBus!);
    this.fadeIn(gain, track.volume);

    const fail = () => {
      // Missing or undecodable file: continue silently.
      if (this.current?.id === id) {
        this.current = null;
        this.setState({ currentTrack: null });
      }
      gain.disconnect();
    };
    element.addEventListener('error', fail, { once: true });
    void element.play().catch(fail);

    return {
      id,
      gain,
      stop: () =>
        this.fadeOutThen(gain, () => {
          element.pause();
          element.removeAttribute('src');
          element.load();
          gain.disconnect();
        }),
    };
  }

  private startGenerativeTrack(
    id: string,
    track: Extract<AudioTrack, { source: 'generative' }>,
  ): PlayingTrack {
    const ctx = this.ctx!;
    const chords: Record<typeof track.preset, number[]> = {
      // Open voicings with no third in the bass: calm and unresolved.
      'night-pad': [110, 164.81, 246.94, 329.63],
      'garden-pad': [130.81, 196, 293.66, 392],
      'warm-pad': [146.83, 220, 277.18, 369.99],
    };
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
    filter.connect(gain).connect(this.musicBus!);

    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoDepth.gain.value = 350;
    lfo.connect(lfoDepth).connect(filter.frequency);
    lfo.start();

    const oscillators = chords[track.preset].flatMap((freq, i) =>
      [-4, 4].map((detune) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const voice = ctx.createGain();
        voice.gain.value = 0.06 / (i + 1);
        osc.connect(voice).connect(filter);
        osc.start();
        return osc;
      }),
    );
    this.fadeIn(gain, track.volume);

    return {
      id,
      gain,
      stop: () =>
        this.fadeOutThen(gain, () => {
          [...oscillators, lfo].forEach((o) => {
            try {
              o.stop();
            } catch {
              // already stopped
            }
          });
          gain.disconnect();
        }),
    };
  }

  // -- effects -------------------------------------------------------------

  /**
   * Plays a short synthesised effect. `pan` is -1 (left) to 1 (right); it is
   * softened so the sound stays comfortable on phone speakers.
   */
  playEffect(name: EffectName, pan = 0): void {
    if (!this.options.effects || !this.ctx || !this.effectsBus || !this.state.enabled) return;
    if (!this.volumes.effectsEnabled) return;
    const ctx = this.ctx;
    try {
      const out = ctx.createGain();
      let destination: AudioNode = this.effectsBus;
      if (this.options.spatial && typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-0.6, Math.min(0.6, pan * 0.6));
        panner.connect(this.effectsBus);
        destination = panner;
      }
      out.connect(destination);

      const notes: Record<EffectName, number[]> = {
        chime: [880, 1318.5],
        bloom: [523.25, 659.25, 783.99],
        soft: [440],
        celebrate: [523.25, 659.25, 783.99, 1046.5],
      };
      const t = ctx.currentTime;
      notes[name].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = t + i * (name === 'celebrate' ? 0.09 : 0.05);
        const length = name === 'soft' ? 0.5 : 1.6;
        env.gain.setValueAtTime(0, start);
        env.gain.linearRampToValueAtTime(0.12, start + 0.015);
        env.gain.exponentialRampToValueAtTime(0.0001, start + length);
        osc.connect(env).connect(out);
        osc.start(start);
        osc.stop(start + length + 0.05);
      });
      window.setTimeout(() => out.disconnect(), 2500);
    } catch {
      // Effects are decoration; ignore failures.
    }
  }
}
