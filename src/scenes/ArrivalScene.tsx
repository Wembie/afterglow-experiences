import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAudio, useAudioState } from '../audio/AudioContext';
import { useExperience } from '../engine/ExperienceContext';
import type { SceneOf } from '../engine/schema';
import { useParticles } from '../particles/ParticleField';
import './arrival.css';

type Phase = 'lines' | 'invite' | 'audio' | 'entering';

const LINE_INTERVAL = 1.9;
const ENTER_MS = 900;

/**
 * The first impression: quiet sky, one light, a few words, an invitation.
 * Nothing blocks access — "skip" is available from the first frame.
 */
export default function ArrivalScene({ scene }: { scene: SceneOf<'arrival'> }) {
  const { experience, strings, reducedMotion, readingMode, entered, markEntered, next } =
    useExperience();
  const audio = useAudio();
  const audioState = useAudioState();
  const particles = useParticles();
  const orbRef = useRef<HTMLDivElement>(null);
  const instant = reducedMotion || readingMode || entered;
  const [phase, setPhase] = useState<Phase>(instant ? 'invite' : 'lines');

  useEffect(() => {
    if (phase !== 'lines') return;
    const ms = (0.8 + scene.lines.length * LINE_INTERVAL) * 1000;
    const timer = window.setTimeout(() => setPhase('invite'), ms);
    return () => window.clearTimeout(timer);
  }, [phase, scene.lines.length]);

  const audioPossible =
    audioState.status !== 'unavailable' &&
    (Object.keys(experience.audio.tracks).length > 0 || experience.audio.effects);

  const enter = (withSound: boolean) => {
    // unlock() must run synchronously inside the click for browsers to allow audio.
    if (withSound) audio?.unlock();
    markEntered();
    if (reducedMotion) {
      next();
      return;
    }
    setPhase('entering');
    const rect = orbRef.current?.getBoundingClientRect();
    if (rect) {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      particles?.burst(x, y, { count: 70, speed: 260, life: 1.8 });
    }
    if (withSound) audio?.playEffect('bloom');
    window.setTimeout(next, ENTER_MS);
  };

  const onInvite = () => {
    if (entered) return next();
    if (audioPossible && scene.audioPrompt && !audioState.enabled) setPhase('audio');
    else enter(audioState.enabled);
  };

  const showInvite = phase === 'invite' || phase === 'audio';

  return (
    <div className={`arrival arrival--${phase}`}>
      {!entered && phase !== 'entering' && (
        <button type="button" className="btn btn--quiet arrival__skip" onClick={() => enter(false)}>
          {strings.skipIntro}
        </button>
      )}

      <div className="arrival__orb" ref={orbRef} aria-hidden="true">
        <span className="arrival__orb-core" />
        <span className="arrival__orb-halo" />
        <span className="arrival__orb-ring" />
      </div>

      <div className="arrival__copy">
        <h1 className="sr-only" data-scene-heading tabIndex={-1}>
          {experience.meta.title}
        </h1>
        {scene.lines.map((line, i) => (
          <p
            key={i}
            className={`display arrival__line ${i === 0 ? 'arrival__line--lead' : ''}`}
            style={{ '--line-delay': `${instant ? 0 : 0.8 + i * LINE_INTERVAL}s` } as CSSProperties}
          >
            {line}
          </p>
        ))}
      </div>

      <div className="arrival__actions" aria-live="polite">
        {showInvite && phase === 'invite' && (
          <button type="button" className="arrival__invite" onClick={onInvite}>
            <span className="arrival__invite-light" aria-hidden="true" />
            <span>{entered ? strings.continue : scene.invitation}</span>
          </button>
        )}
        {phase === 'audio' && scene.audioPrompt && (
          <div className="arrival__audio" role="group" aria-labelledby="arrival-audio-q">
            <p id="arrival-audio-q" className="arrival__audio-question">
              {scene.audioPrompt.question}
            </p>
            <div className="arrival__audio-buttons">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => enter(true)}
                autoFocus
              >
                {scene.audioPrompt.accept}
              </button>
              <button type="button" className="btn" onClick={() => enter(false)}>
                {scene.audioPrompt.decline}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
