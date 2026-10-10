import { RevealText } from './RevealText';

interface Props {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

/** Consistent scene heading; receives focus when the scene opens. */
export function SceneHeader({ eyebrow, title, subtitle, className = '' }: Props) {
  if (!title && !subtitle && !eyebrow) return null;
  return (
    <header className={`scene-header ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {title && (
        <h1 className="display scene-header__title" data-scene-heading tabIndex={-1}>
          <RevealText text={title} reveal="words" as="span" maxDuration={1.2} />
        </h1>
      )}
      {subtitle && (
        <RevealText
          text={subtitle}
          reveal="fade"
          delay={0.5}
          className="scene-header__subtitle"
          as="p"
        />
      )}
    </header>
  );
}
