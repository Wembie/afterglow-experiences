import type { CSSProperties } from 'react';
import { RevealText } from '../components/RevealText';
import { useExperience } from '../engine/ExperienceContext';
import type { ClosingAction, SceneOf, SceneType } from '../engine/schema';
import './closing.css';

/** The end of a small journey: calm, personal, and open to returning. */
export default function ClosingScene({ scene }: { scene: SceneOf<'closing'> }) {
  const { experience, strings, scenes, goToScene, exploredMemories } = useExperience();
  const message = experience.messages.find((m) => m.id === scene.messageId);

  const firstOf = (type: SceneType) => scenes.find((s) => s.type === type);
  const letterScene = scenes.find(
    (s) =>
      s.type === 'message' &&
      experience.messages.find((m) => m.id === s.messageId)?.kind === 'letter',
  );

  const actions: { key: ClosingAction; label: string; target: string | undefined }[] =
    scene.actions.map((action) => {
      switch (action) {
        case 'replay':
          return { key: action, label: strings.replay, target: scenes[0]?.id };
        case 'memories':
          return {
            key: action,
            label: strings.revisitMemories,
            target: firstOf('memories')?.id ?? firstOf('constellation')?.id,
          };
        case 'tree':
          return { key: action, label: strings.returnToTree, target: firstOf('tree')?.id };
        case 'letter':
          return { key: action, label: strings.openLetter, target: letterScene?.id };
        case 'celebration':
          return {
            key: action,
            label: strings.viewCelebration,
            target: firstOf('celebration')?.id,
          };
      }
    });

  return (
    <div className="closing">
      {/* Every memory opened during the visit returns as a small light. */}
      <div className="closing__lights" aria-hidden="true">
        {Array.from(exploredMemories).map((id, i) => (
          <span key={id} style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
      {scene.title && (
        <h1 className="display closing__title" data-scene-heading tabIndex={-1}>
          {scene.title}
        </h1>
      )}
      {message && (
        <RevealText
          text={message.body}
          reveal={message.reveal}
          delay={0.6}
          className="closing__message"
        />
      )}
      {(message?.signature ?? experience.creator.signature) && (
        <p className="hand closing__signature">
          {message?.signature ?? experience.creator.signature}
        </p>
      )}
      <nav className="closing__actions" aria-label={strings.sceneIndex}>
        {actions
          .filter((a) => a.target)
          .map((a, i) => (
            <button
              key={a.key}
              type="button"
              className={`btn ${i === 0 ? '' : 'btn--quiet'}`}
              onClick={() => goToScene(a.target!)}
            >
              {a.label}
            </button>
          ))}
      </nav>
    </div>
  );
}
