import type { CSSProperties } from 'react';
import { Photo } from '../components/Photo';
import { RevealText } from '../components/RevealText';
import { SceneHeader } from '../components/SceneHeader';
import { formatDate } from '../engine/dates';
import { selectById, useExperience } from '../engine/ExperienceContext';
import type { Nickname, SceneOf } from '../engine/schema';
import { useInView } from '../hooks/useInView';
import './names.css';

/** Names, usernames and inside jokes — short words that carry a whole history. */
export default function NamesScene({ scene }: { scene: SceneOf<'names'> }) {
  const { experience } = useExperience();
  const names = selectById(experience.nicknames, scene.nicknameIds);
  return (
    <div className="names-scene">
      <SceneHeader title={scene.title} subtitle={scene.subtitle} />
      {scene.intro && (
        <RevealText text={scene.intro} className="prose names-scene__intro" delay={0.5} />
      )}
      <ul className="names">
        {names.map((n, i) => (
          <NameEntry key={n.id} entry={n} index={i} />
        ))}
      </ul>
    </div>
  );
}

function NameEntry({ entry, index }: { entry: Nickname; index: number }) {
  const { experience, reducedMotion, readingMode, getImage, openMemory, strings } = useExperience();
  const [ref, visible] = useInView<HTMLLIElement>({ rootMargin: '0px 0px -15% 0px', once: true });
  const date = formatDate(entry.date, experience.locale);
  const image = getImage(entry.image);
  const animate = !reducedMotion && !readingMode;
  // Letter assembly only for short names; longer phrases fade as a whole.
  const letters = animate && entry.name.length <= 18 ? Array.from(entry.name) : null;

  return (
    <li
      ref={ref}
      className={`name name--${entry.kind}`}
      data-visible={visible || undefined}
      style={{ '--i': index } as CSSProperties}
    >
      <p className="eyebrow name__kind">{kindLabel(entry.kind, experience.locale)}</p>
      <h2 className="display name__text">
        {letters ? (
          <>
            <span className="sr-only">{entry.name}</span>
            <span aria-hidden="true" className="name__letters">
              {letters.map((ch, i) => (
                <span key={i} style={{ '--l': i } as CSSProperties}>
                  {ch === ' ' ? ' ' : ch}
                </span>
              ))}
            </span>
          </>
        ) : (
          entry.name
        )}
      </h2>
      {date && <p className="hand name__date">{date}</p>}
      {entry.explanation && <p className="prose name__explanation">{entry.explanation}</p>}
      {image && (
        <div className="name__photo">
          <Photo image={image} className="photo--graded" />
        </div>
      )}
      {entry.memoryId && (
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => openMemory(entry.memoryId!)}
        >
          {strings.openMemory}
        </button>
      )}
    </li>
  );
}

const kindLabels: Record<string, Record<Nickname['kind'], string>> = {
  es: {
    nickname: 'Apodo',
    username: 'Usuario',
    'former-username': 'Antes conocida como',
    alias: 'Alias',
    phrase: 'Frase',
    'inside-joke': 'Chiste interno',
  },
  en: {
    nickname: 'Nickname',
    username: 'Username',
    'former-username': 'Formerly known as',
    alias: 'Alias',
    phrase: 'Phrase',
    'inside-joke': 'Inside joke',
  },
};

function kindLabel(kind: Nickname['kind'], locale: string): string {
  const lang = locale.split('-')[0] ?? 'en';
  return (kindLabels[lang] ?? kindLabels.en!)[kind];
}
