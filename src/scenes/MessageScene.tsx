import { useState } from 'react';
import { RevealText } from '../components/RevealText';
import { useExperience } from '../engine/ExperienceContext';
import type { SceneOf } from '../engine/schema';
import './message.css';

/** A letter on a calm surface. Readable first; animation is a courtesy. */
export default function MessageScene({ scene }: { scene: SceneOf<'message'> }) {
  const { experience, strings, reducedMotion, readingMode } = useExperience();
  const message = experience.messages.find((m) => m.id === scene.messageId);
  const [instant, setInstant] = useState(false);
  if (!message) return null;

  const canSkip = !reducedMotion && !readingMode && message.reveal !== 'none' && !instant;
  const title = message.title ?? scene.title;

  return (
    <article className={`letter letter--${message.kind}`} data-instant={instant || undefined}>
      {scene.subtitle && <p className="eyebrow letter__eyebrow">{scene.subtitle}</p>}
      {title && (
        <h1 className="display letter__title" data-scene-heading tabIndex={-1}>
          {title}
          {message.placeholder && import.meta.env.DEV && (
            <span className="placeholder-badge">placeholder</span>
          )}
        </h1>
      )}
      <RevealText
        text={message.body}
        reveal={message.reveal}
        delay={0.4}
        maxDuration={6}
        className={`letter__body ${message.kind === 'letter' ? 'letter__body--long' : ''}`}
      />
      {message.signature && <p className="hand letter__signature">{message.signature}</p>}
      {canSkip && (
        <button
          type="button"
          className="btn btn--quiet letter__skip"
          onClick={() => setInstant(true)}
        >
          {strings.skipAnimation}
        </button>
      )}
    </article>
  );
}
