import { useState, type CSSProperties, type MouseEvent } from 'react';
import { Photo } from '../components/Photo';
import { RevealText } from '../components/RevealText';
import { SceneHeader } from '../components/SceneHeader';
import { formatDate } from '../engine/dates';
import { selectMemories, useExperience } from '../engine/ExperienceContext';
import type { Memory, SceneOf } from '../engine/schema';
import { useInView } from '../hooks/useInView';
import './memories.css';

/** Placement rhythm for desktop: varied widths, offsets and tilts, never a uniform grid. */
/** Pairs share a row; the offset only pushes down, so prints never overlap. */
const SLOTS = [
  { col: '1 / span 5', shift: '0rem', tilt: -2.2 },
  { col: '7 / span 5', shift: '6rem', tilt: 1.6 },
  { col: '2 / span 4', shift: '0rem', tilt: 1.1 },
  { col: '7 / span 4', shift: '4rem', tilt: -1.4 },
  { col: '1 / span 5', shift: '1.5rem', tilt: 1.8 },
  { col: '7 / span 5', shift: '5rem', tilt: -0.8 },
];

export default function MemoriesScene({ scene }: { scene: SceneOf<'memories'> }) {
  const { experience, strings } = useExperience();
  const memories = selectMemories(experience, scene.memoryIds);
  const [category, setCategory] = useState<string | null>(null);
  const usedCategories = experience.categories.filter((c) =>
    memories.some((m) => m.category === c.id),
  );
  const visible = category ? memories.filter((m) => m.category === category) : memories;

  return (
    <div className="memories">
      <SceneHeader title={scene.title} subtitle={scene.subtitle} />
      {scene.intro && (
        <RevealText text={scene.intro} className="prose memories__intro" delay={0.6} />
      )}

      {usedCategories.length > 1 && (
        <div className="memories__filters" role="group" aria-label={strings.memoryList}>
          <button
            type="button"
            className="chip"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
          >
            {strings.memoryList}
          </button>
          {usedCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <ul className="memories__field">
        {visible.map((memory, i) => (
          <MemoryPrint key={memory.id} memory={memory} index={i} />
        ))}
      </ul>
    </div>
  );
}

function MemoryPrint({ memory, index }: { memory: Memory; index: number }) {
  const { experience, strings, getImage, openMemory, exploredMemories } = useExperience();
  const [ref, near] = useInView<HTMLLIElement>();
  const slot = SLOTS[index % SLOTS.length]!;
  const date = formatDate(memory.date, experience.locale);
  const cover = getImage(memory.photos[0]);
  const extra = memory.photos.length - 1;

  const open = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    openMemory(memory.id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <li
      ref={ref}
      className="print"
      data-near={near || undefined}
      data-explored={exploredMemories.has(memory.id) || undefined}
      style={
        {
          '--col': slot.col,
          '--shift': slot.shift,
          '--tilt': `${slot.tilt}deg`,
          '--i': index,
        } as CSSProperties
      }
    >
      <button type="button" className="print__button" onClick={open}>
        <span className="print__frame">
          <Photo
            image={cover}
            className="photo--graded print__photo"
            decorative
            label={memory.title}
          />
          {extra > 0 && (
            <span className="print__more" aria-hidden="true">
              +{extra}
            </span>
          )}
        </span>
        <span className="print__caption">
          {date && <span className="hand print__date">{date}</span>}
          <span className="display print__title">{memory.title}</span>
          <span className="sr-only">
            {strings.openMemory}
            {cover?.alt ? `. ${cover.alt}` : ''}
          </span>
        </span>
      </button>
    </li>
  );
}
