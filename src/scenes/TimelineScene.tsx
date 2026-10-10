import type { CSSProperties } from 'react';
import { Photo } from '../components/Photo';
import { RevealText } from '../components/RevealText';
import { SceneHeader } from '../components/SceneHeader';
import { dateMarker, dateTimeAttr, formatDate } from '../engine/dates';
import { selectById, useExperience } from '../engine/ExperienceContext';
import type { SceneOf, TimelineEvent } from '../engine/schema';
import { useInView } from '../hooks/useInView';
import './timeline.css';

/** Events keep the creator's order: they decide how the story is told. */
export default function TimelineScene({ scene }: { scene: SceneOf<'timeline'> }) {
  const { experience } = useExperience();
  const events = selectById(experience.timeline, scene.eventIds);

  return (
    <div className="timeline-scene">
      <SceneHeader title={scene.title} subtitle={scene.subtitle} />
      {scene.intro && (
        <RevealText text={scene.intro} className="prose timeline-scene__intro" delay={0.5} />
      )}
      <ol className="timeline">
        {events.map((event, i) => (
          <TimelineItem key={event.id} event={event} index={i} />
        ))}
      </ol>
    </div>
  );
}

function TimelineItem({ event, index }: { event: TimelineEvent; index: number }) {
  const { experience, strings, getImage, openMemory } = useExperience();
  const [ref, visible] = useInView<HTMLLIElement>({ rootMargin: '0px 0px -12% 0px', once: true });
  const date = formatDate(event.date, experience.locale) ?? strings.undated;
  const marker = dateMarker(event.date);
  const image = getImage(event.image);

  return (
    <li
      ref={ref}
      className="moment"
      data-visible={visible || undefined}
      data-side={index % 2 === 0 ? 'left' : 'right'}
      style={{ '--i': index } as CSSProperties}
    >
      <span className="moment__node" aria-hidden="true" />
      {marker && (
        <span className="moment__marker" aria-hidden="true">
          {marker}
        </span>
      )}
      <div className="moment__body">
        <time className="hand moment__date" dateTime={dateTimeAttr(event.date)}>
          {date}
        </time>
        <h2 className="display moment__title">{event.title}</h2>
        {event.description && <p className="prose moment__text">{event.description}</p>}
        {image && (
          <div className="moment__photo">
            <Photo image={image} className="photo--graded" />
          </div>
        )}
        {event.memoryId && (
          <button
            type="button"
            className="btn moment__open"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              openMemory(event.memoryId!, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
            }}
          >
            {strings.openMemory}
          </button>
        )}
      </div>
    </li>
  );
}
