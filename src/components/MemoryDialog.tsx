import { formatDate, dateTimeAttr } from '../engine/dates';
import { useExperience } from '../engine/ExperienceContext';
import type { Memory } from '../engine/schema';
import { Dialog } from './Dialog';
import { Gallery } from './Gallery';
import { RevealText } from './RevealText';
import './memory.css';

interface Props {
  memory: Memory | undefined;
  onClose: () => void;
}

/** The opened memory: the photograph leads, the words follow with a deliberate rhythm. */
export function MemoryDialog({ memory, onClose }: Props) {
  const { experience, strings } = useExperience();
  const titleId = memory ? `memory-title-${memory.id}` : 'memory-title';
  const category = experience.categories.find((c) => c.id === memory?.category);
  const date = formatDate(memory?.date, experience.locale);

  return (
    <Dialog
      open={Boolean(memory)}
      onClose={onClose}
      labelledBy={titleId}
      closeLabel={strings.close}
      className="memory-dialog"
    >
      {memory && (
        <article className="memory" data-theme-hint={memory.theme}>
          <div className="memory__visual">
            <Gallery key={memory.id} photoIds={memory.photos} title={memory.title} />
          </div>
          <div className="memory__text">
            <p className="eyebrow memory__meta">
              {category && <span>{category.label}</span>}
              {date && <time dateTime={dateTimeAttr(memory.date)}>{date}</time>}
              {memory.location && <span>{memory.location}</span>}
            </p>
            <h2 id={titleId} className="display memory__title" data-autofocus tabIndex={-1}>
              {memory.title}
              {memory.placeholder && import.meta.env.DEV && (
                <span className="placeholder-badge">placeholder</span>
              )}
            </h2>
            {memory.description && (
              <RevealText
                text={memory.description}
                reveal="fade"
                delay={0.25}
                className="prose memory__description"
              />
            )}
            {memory.message && (
              <RevealText
                text={memory.message}
                reveal="handwritten"
                delay={0.7}
                className="memory__message"
              />
            )}
            {memory.tags.length > 0 && (
              <ul className="memory__tags">
                {memory.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </div>
        </article>
      )}
    </Dialog>
  );
}
