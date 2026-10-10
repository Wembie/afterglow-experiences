/**
 * Kinetic typography that stays real text: selectable, read whole by screen
 * readers, and rendered instantly in reduced-motion or reading mode.
 */
import type { CSSProperties, ElementType } from 'react';
import type { RevealStyle } from '../engine/schema';
import { useExperience } from '../engine/ExperienceContext';
import './reveal.css';

interface Props {
  text: string;
  reveal?: RevealStyle;
  as?: ElementType;
  className?: string;
  /** Seconds before the reveal starts. */
  delay?: number;
  /** Longest a word-by-word reveal may take, in seconds, regardless of length. */
  maxDuration?: number;
  id?: string;
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function RevealText({
  text,
  reveal = 'fade',
  as: Tag = 'div',
  className = '',
  delay = 0,
  maxDuration = 5,
  id,
}: Props) {
  const { reducedMotion, readingMode } = useExperience();
  const instant = reducedMotion || readingMode || reveal === 'none';
  const blocks = paragraphs(text);
  const style = { '--reveal-delay': `${delay}s` } as CSSProperties;
  const multi = blocks.length > 1;

  if (instant) {
    return (
      <Tag id={id} className={`reveal reveal--instant ${className}`}>
        {multi ? blocks.map((p, i) => <p key={i}>{p}</p>) : blocks[0]}
      </Tag>
    );
  }

  if (reveal === 'words') {
    const totalWords = blocks.reduce((n, p) => n + p.split(/\s+/).length, 0);
    const step = Math.min(0.09, maxDuration / Math.max(totalWords, 1));
    let index = 0;
    const renderWords = (p: string) =>
      p.split(/(\s+)/).map((token, i) => {
        if (/^\s+$/.test(token)) return token;
        const style = { '--i': index++, '--step': `${step}s` } as CSSProperties;
        return (
          <span key={i} className="reveal__word" style={style}>
            {token}
          </span>
        );
      });
    return (
      <Tag id={id} className={`reveal reveal--words ${className}`} style={style}>
        {multi
          ? blocks.map((p, i) => <p key={i}>{renderWords(p)}</p>)
          : renderWords(blocks[0] ?? '')}
      </Tag>
    );
  }

  if (reveal === 'lines') {
    return (
      <Tag id={id} className={`reveal reveal--lines ${className}`} style={style}>
        {blocks.map((p, i) => (
          <span key={i} className="reveal__line" style={{ '--i': i } as CSSProperties}>
            {p}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag id={id} className={`reveal reveal--${reveal} ${className}`} style={style}>
      {multi ? blocks.map((p, i) => <p key={i}>{p}</p>) : blocks[0]}
    </Tag>
  );
}
