import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { assetUrl } from '../engine/assets';
import type { Experience } from '../engine/schema';
import { usePreferences } from '../preferences/preferences';
import { AudioManager, type AudioState } from './AudioManager';

const AudioManagerContext = createContext<AudioManager | null>(null);

export function AudioProvider({
  experience,
  children,
}: {
  experience: Experience;
  children: ReactNode;
}) {
  const [manager] = useState(
    () =>
      new AudioManager(experience.audio.tracks, (src) => assetUrl(experience.slug, src), {
        spatial: experience.audio.spatial,
        effects: experience.audio.effects,
      }),
  );
  const prefs = usePreferences();

  useEffect(() => () => manager.dispose(), [manager]);

  useEffect(() => {
    manager.setVolumes({
      master: prefs.masterVolume,
      music: prefs.musicVolume,
      effects: prefs.effectsVolume,
      effectsEnabled: prefs.effectsEnabled,
    });
  }, [manager, prefs.masterVolume, prefs.musicVolume, prefs.effectsVolume, prefs.effectsEnabled]);

  return <AudioManagerContext.Provider value={manager}>{children}</AudioManagerContext.Provider>;
}

export function useAudio(): AudioManager | null {
  return useContext(AudioManagerContext);
}

const lockedState: AudioState = { status: 'unavailable', enabled: false, currentTrack: null };
const noopSubscribe = () => () => {};

export function useAudioState(): AudioState {
  const manager = useAudio();
  return useSyncExternalStore(
    manager?.subscribe ?? noopSubscribe,
    manager?.getState ?? (() => lockedState),
    () => lockedState,
  );
}
