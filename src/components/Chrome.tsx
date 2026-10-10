import { useId } from 'react';
import { useAudio, useAudioState } from '../audio/AudioContext';
import { useExperience } from '../engine/ExperienceContext';
import { sceneLabel } from '../engine/scenes';
import { format } from '../engine/strings';
import { setPreferences, usePreferences, type Preferences } from '../preferences/preferences';
import {
  ChaptersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SlidersIcon,
  SoundOffIcon,
  SoundOnIcon,
} from './Icons';
import { Popover } from './Popover';
import './chrome.css';

/** Top-right controls: sound, settings, chapter index. */
export function Controls() {
  const { experience, strings, scenes, sceneIndex, goToScene } = useExperience();
  const audio = useAudio();
  const audioState = useAudioState();
  const soundOn = audioState.enabled;

  const toggleSound = () => {
    if (!audio) return;
    if (soundOn) audio.disable();
    else audio.unlock();
  };

  return (
    <div className="controls" role="group" aria-label={strings.settings}>
      {audioState.status !== 'unavailable' && (
        <button
          type="button"
          className="icon-btn"
          aria-pressed={soundOn}
          aria-label={soundOn ? strings.soundOff : strings.soundOn}
          onClick={toggleSound}
        >
          {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
      )}
      <Popover label={strings.settings} icon={<SlidersIcon />}>
        {() => <SettingsPanel />}
      </Popover>
      {experience.navigation.showSceneIndex && (
        <Popover label={strings.sceneIndex} icon={<ChaptersIcon />}>
          {(close) => (
            <nav aria-label={strings.sceneIndex}>
              <p className="eyebrow popover__title">{strings.sceneIndex}</p>
              <ol className="chapters">
                {scenes.map((scene, i) => (
                  <li key={scene.id}>
                    <button
                      type="button"
                      className="chapters__item"
                      aria-current={i === sceneIndex ? 'step' : undefined}
                      onClick={() => {
                        close();
                        goToScene(scene.id);
                      }}
                    >
                      <span className="chapters__number">{String(i + 1).padStart(2, '0')}</span>
                      {sceneLabel(scene)}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </Popover>
      )}
    </div>
  );
}

function SettingsPanel() {
  const { strings, experience } = useExperience();
  const prefs = usePreferences();
  const audioState = useAudioState();
  const ids = {
    master: useId(),
    music: useId(),
    effects: useId(),
    motion: useId(),
    quality: useId(),
  };
  const credits = Object.values(experience.audio.tracks)
    .map((t) => (t.source === 'file' ? t.credit : undefined))
    .filter(Boolean);

  const slider = (
    key: 'masterVolume' | 'musicVolume' | 'effectsVolume',
    id: string,
    label: string,
  ) => (
    <div className="settings__row">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={prefs[key]}
        onChange={(e) => setPreferences({ [key]: Number(e.target.value) })}
      />
    </div>
  );

  const choice = <K extends 'motion' | 'quality'>(
    key: K,
    id: string,
    label: string,
    options: [Preferences[K], string][],
  ) => (
    <fieldset className="settings__choice" aria-labelledby={id}>
      <legend id={id}>{label}</legend>
      <div className="settings__segments">
        {options.map(([value, text]) => (
          <label key={value} className="settings__segment">
            <input
              type="radio"
              name={`${key}-${id}`}
              value={value}
              checked={prefs[key] === value}
              onChange={() => setPreferences({ [key]: value } as Partial<Preferences>)}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="settings">
      <p className="eyebrow popover__title">{strings.settings}</p>
      {audioState.status !== 'unavailable' && (
        <>
          {slider('masterVolume', ids.master, strings.masterVolume)}
          {slider('musicVolume', ids.music, strings.musicVolume)}
          {slider('effectsVolume', ids.effects, strings.effectsVolume)}
          <label className="settings__toggle">
            <input
              type="checkbox"
              checked={prefs.effectsEnabled}
              onChange={(e) => setPreferences({ effectsEnabled: e.target.checked })}
            />
            <span>{strings.effects}</span>
          </label>
        </>
      )}
      {choice('motion', ids.motion, strings.motion, [
        ['system', strings.motionSystem],
        ['full', strings.motionFull],
        ['reduced', strings.motionReduced],
      ])}
      {choice('quality', ids.quality, strings.quality, [
        ['auto', strings.qualityAuto],
        ['high', strings.qualityHigh],
        ['low', strings.qualityLow],
      ])}
      <label className="settings__toggle">
        <input
          type="checkbox"
          checked={prefs.readingMode}
          onChange={(e) => setPreferences({ readingMode: e.target.checked })}
        />
        <span>{strings.readingMode}</span>
      </label>
      {credits.length > 0 && <p className="settings__credits">♪ {credits.join(' · ')}</p>}
    </div>
  );
}

/** Bottom navigation: back, quiet progress, continue. */
export function SceneNav() {
  const { experience, strings, scenes, sceneIndex, next, previous } = useExperience();
  const total = scenes.length;
  const isLast = sceneIndex >= total - 1;
  return (
    <nav
      className="scene-nav"
      aria-label={format(strings.progress, { current: sceneIndex + 1, total })}
    >
      <button
        type="button"
        className="btn btn--quiet scene-nav__prev"
        onClick={previous}
        disabled={sceneIndex === 0}
      >
        <ChevronLeftIcon />
        <span>{strings.previous}</span>
      </button>
      {experience.navigation.showProgress && (
        <div className="scene-nav__progress">
          <span className="sr-only">
            {format(strings.progress, { current: sceneIndex + 1, total })}
          </span>
          <span className="scene-nav__track" aria-hidden="true">
            <span
              className="scene-nav__fill"
              style={{ transform: `scaleX(${(sceneIndex + 1) / total})` }}
            />
          </span>
        </div>
      )}
      {!isLast && (
        <button type="button" className="btn btn--primary scene-nav__next" onClick={next}>
          <span>{strings.next}</span>
          <ChevronRightIcon />
        </button>
      )}
    </nav>
  );
}
