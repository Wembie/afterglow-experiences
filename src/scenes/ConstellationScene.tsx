import { useSyncExternalStore, type CSSProperties, type MouseEvent } from 'react';
import { SceneHeader } from '../components/SceneHeader';
import { formatDate } from '../engine/dates';
import { selectMemories, useExperience } from '../engine/ExperienceContext';
import type { SceneOf } from '../engine/schema';
import { format } from '../engine/strings';
import { hashString } from '../lib/random';
import { layoutStars, linkStars } from '../lib/constellation';
import './constellation.css';

/**
 * "Our constellation": memories as fixed points of light. Opening a memory
 * lights the lines to its already-visited neighbours — the sky fills in as
 * the story is explored, but nothing ever moves away from the visitor.
 */
export default function ConstellationScene({ scene }: { scene: SceneOf<'constellation'> }) {
  const { experience, strings, openMemory, exploredMemories } = useExperience();
  const memories = selectMemories(experience, scene.memoryIds);
  const ids = memories.map((m) => m.id);
  const narrow = useNarrow();
  // Cheap and deterministic: recomputed on render, always identical positions.
  const stars = layoutStars(
    ids,
    scene.seed ?? hashString(`${experience.id}:sky`),
    narrow ? {} : scene.positions,
    narrow ? 2 : undefined,
  );
  const rows = Math.ceil(ids.length / 2);
  const links = linkStars(stars);
  const byId = new Map(stars.map((s) => [s.id, s]));

  const open = (id: string, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    openMemory(id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <div className="constellation-scene">
      <SceneHeader title={scene.title} subtitle={scene.subtitle} />
      {scene.prompt && <p className="hand constellation-scene__prompt">{scene.prompt}</p>}
      <p className="constellation-scene__count">
        {format(strings.explored, {
          count: ids.filter((id) => exploredMemories.has(id)).length,
          total: ids.length,
        })}
      </p>

      <div
        className="sky-map"
        style={
          narrow ? ({ '--sky-height': `${Math.max(26, rows * 8)}rem` } as CSSProperties) : undefined
        }
      >
        <svg
          className="sky-map__lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {links.map((link) => {
            const a = byId.get(link.from);
            const b = byId.get(link.to);
            if (!a || !b) return null;
            const lit = exploredMemories.has(link.from) && exploredMemories.has(link.to);
            return (
              <line
                key={`${link.from}-${link.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={lit ? 'is-lit' : undefined}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <ol className="sky-map__stars">
          {memories.map((memory, i) => {
            const star = byId.get(memory.id);
            if (!star) return null;
            const date = formatDate(memory.date, experience.locale);
            return (
              <li
                key={memory.id}
                className="star"
                style={{ left: `${star.x}%`, top: `${star.y}%`, '--i': i } as CSSProperties}
                data-explored={exploredMemories.has(memory.id) || undefined}
                data-side={star.x > 60 ? 'right' : 'left'}
              >
                <button type="button" className="star__button" onClick={(e) => open(memory.id, e)}>
                  <span className="star__light" aria-hidden="true" />
                  <span className="star__label">
                    <span className="star__title">{memory.title}</span>
                    {date && <span className="star__date">{date}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

const NARROW_QUERY = '(max-width: 640px)';

function useNarrow(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {};
      const mq = window.matchMedia(NARROW_QUERY);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}
