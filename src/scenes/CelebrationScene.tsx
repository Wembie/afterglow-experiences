import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAudio } from '../audio/AudioContext';
import { RevealText } from '../components/RevealText';
import { useExperience } from '../engine/ExperienceContext';
import type { SceneOf } from '../engine/schema';
import { createRandom, hashString } from '../lib/random';
import { useParticles } from '../particles/ParticleField';
import './celebration.css';

const PHASES = ['quiet', 'gather', 'name', 'bloom', 'message', 'done'] as const;
type Phase = (typeof PHASES)[number];

/** Seconds at which each phase begins (before pacing). */
const TIMELINE: Record<Phase, number> = {
  quiet: 0,
  gather: 1.1,
  name: 3.3,
  bloom: 4.5,
  message: 5.6,
  done: 7.4,
};

/**
 * The finale. The quiet before, the lights from the journey gathering, the
 * name, then the world opening up. Calm brightness changes only — no strobes.
 */
export default function CelebrationScene({ scene }: { scene: SceneOf<'celebration'> }) {
  const { experience, strings, reducedMotion, readingMode, exploredMemories } = useExperience();
  const audio = useAudio();
  const particles = useParticles();
  const instant = reducedMotion || readingMode;
  const [timedPhase, setPhase] = useState<Phase>('quiet');
  const phase: Phase = instant ? 'done' : timedPhase;
  const centerRef = useRef<HTMLDivElement>(null);
  const message = experience.messages.find((m) => m.id === scene.messageId);
  const name = scene.name ?? experience.recipient.name;
  const palette = scene.palette;

  // One light for each memory gathered on the way (at least a handful).
  const lights = useMemo(() => {
    const random = createRandom(hashString(scene.id));
    const count = Math.min(24, Math.max(8, exploredMemories.size * 2));
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + random() * 0.4;
      const distance = 38 + random() * 22;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        delay: random() * 0.8,
      };
    });
    // Lights are computed once per visit to the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  useEffect(() => {
    if (instant) return;
    const timers = PHASES.slice(1).map((p) =>
      window.setTimeout(() => setPhase(p), TIMELINE[p] * scene.pacing * 1000),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [instant, scene.pacing]);

  // Side effects for each phase: particles and sound follow the story.
  useEffect(() => {
    if (instant || !particles) return;
    const rect = centerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    if (phase === 'gather') particles.gather(cx, cy);
    if (phase === 'name') audio?.playEffect('celebrate');
    // Skipping ahead must never leave the particles held in the centre.
    if (phase === 'message' || phase === 'done') particles.release(80);
    if (phase === 'bloom') {
      particles.release(260);
      particles.burst(cx, cy, { count: 90, speed: 320, life: 2.4, colors: palette });
      window.setTimeout(
        () => particles.burst(cx, cy, { count: 50, speed: 200, life: 2, colors: palette }),
        450,
      );
    }
    return undefined;
  }, [phase, instant, particles, audio, palette]);

  useEffect(() => () => particles?.release(0), [particles]);

  const reached = (p: Phase) => PHASES.indexOf(phase) >= PHASES.indexOf(p);

  return (
    <div
      className={`finale finale--${phase}`}
      style={
        palette
          ? ({ '--finale-1': palette[0], '--finale-2': palette[1] ?? palette[0] } as CSSProperties)
          : undefined
      }
    >
      <div className="finale__veil" aria-hidden="true" />
      <div className="finale__rays-frame" aria-hidden="true">
        <div className="finale__rays" />
      </div>

      <div className="finale__stage">
        <div className="finale__center" ref={centerRef} aria-hidden="true">
          <span className="finale__core" />
          {lights.map((l, i) => (
            <span
              key={i}
              className="finale__mote"
              style={
                { '--x': `${l.x}vmin`, '--y': `${l.y}vmin`, '--d': `${l.delay}s` } as CSSProperties
              }
            />
          ))}
          <span className="finale__ring" />
          <span className="finale__ring finale__ring--2" />
        </div>

        <div className="finale__words">
          <p className="eyebrow finale__headline" data-shown={reached('name') || undefined}>
            {scene.headline}
          </p>
          <h1
            className="display finale__name"
            data-scene-heading
            tabIndex={-1}
            data-shown={reached('name') || undefined}
          >
            <span className={instant ? '' : 'finale__name-sweep'}>{name}</span>
          </h1>
          {message && reached('message') && (
            <div className="finale__message">
              <RevealText
                text={message.body}
                reveal={instant ? 'none' : 'words'}
                maxDuration={3.5}
              />
              {message.signature && <p className="hand finale__signature">{message.signature}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="finale__actions">
        {!reached('done') && (
          <button type="button" className="btn btn--quiet" onClick={() => setPhase('done')}>
            {strings.skipAnimation}
          </button>
        )}
      </div>

      {/* Screen readers get the whole moment at once. */}
      {!reached('message') && message && (
        <p className="sr-only">
          {scene.headline}, {name}. {message.body}
        </p>
      )}
    </div>
  );
}
