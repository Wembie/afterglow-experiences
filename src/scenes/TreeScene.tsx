import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useAudio } from '../audio/AudioContext';
import { SceneHeader } from '../components/SceneHeader';
import { formatDate } from '../engine/dates';
import { selectMemories, useExperience } from '../engine/ExperienceContext';
import type { SceneOf } from '../engine/schema';
import { format } from '../engine/strings';
import { hashString } from '../lib/random';
import { generateTree, traceToRoot } from '../lib/tree';
import { useParticles } from '../particles/ParticleField';
import './tree.css';

/** Time for the energy trail to reach the memory before it opens. */
const TRAIL_MS = 650;

export default function TreeScene({ scene }: { scene: SceneOf<'tree'> }) {
  const { experience, strings, reducedMotion, openMemory, exploredMemories } = useExperience();
  const audio = useAudio();
  const particles = useParticles();
  const memories = selectMemories(experience, scene.memoryIds);
  const seed = scene.seed ?? hashString(experience.id);
  const tree = useMemo(() => generateTree(seed, memories.length), [seed, memories.length]);
  const [active, setActive] = useState<{ index: number; trail: string } | null>(null);
  const pendingTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(pendingTimer.current), []);

  const select = (index: number, e: MouseEvent<HTMLButtonElement>) => {
    const memory = memories[index];
    const spot = tree.spots[index];
    if (!memory || !spot) return;
    window.clearTimeout(pendingTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setActive({ index, trail: traceToRoot(tree.branches, spot.branch) });

    if (reducedMotion) {
      openMemory(memory.id, origin);
      return;
    }
    // Immediate feedback, then the memory opens once the light arrives.
    audio?.playEffect('soft', (origin.x / window.innerWidth) * 2 - 1);
    particles?.ripple(origin.x, origin.y);
    pendingTimer.current = window.setTimeout(() => openMemory(memory.id, origin), TRAIL_MS);
  };

  const pct = (v: number) => `${(v / tree.size) * 100}%`;
  const activeSpot = active ? tree.spots[active.index] : undefined;

  return (
    <div className="tree-scene">
      <SceneHeader title={scene.title} subtitle={scene.subtitle} className="tree-scene__header" />
      {scene.prompt && <p className="tree-scene__prompt hand">{scene.prompt}</p>}
      <p className="tree-scene__count">
        {format(strings.explored, {
          count: memories.filter((m) => exploredMemories.has(m.id)).length,
          total: memories.length,
        })}
      </p>

      <div className={`tree ${active ? 'tree--active' : ''}`}>
        <div className="tree__mist" aria-hidden="true" />
        <div className="tree__sway">
          <svg
            className="tree__svg"
            viewBox={`0 0 ${tree.size} ${tree.size}`}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient
                id="tree-bark"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1={tree.size * 0.95}
                x2="0"
                y2={tree.size * 0.15}
              >
                <stop offset="0" style={{ stopColor: 'var(--color-warm)', stopOpacity: 0.6 }} />
                <stop
                  offset="0.45"
                  style={{ stopColor: 'var(--color-accent)', stopOpacity: 0.55 }}
                />
                <stop offset="1" style={{ stopColor: 'var(--color-glow)', stopOpacity: 0.9 }} />
              </linearGradient>
              <radialGradient id="tree-heart" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" style={{ stopColor: 'var(--color-glow)', stopOpacity: 0.4 }} />
                <stop offset="1" style={{ stopColor: 'var(--color-glow)', stopOpacity: 0 }} />
              </radialGradient>
            </defs>

            <ellipse
              cx={tree.size / 2}
              cy={tree.size * 0.45}
              rx="330"
              ry="300"
              fill="url(#tree-heart)"
              className="tree__heart"
            />

            <g className="tree__roots">
              {tree.roots.map((root) => (
                <path key={root.id} d={root.d} strokeWidth={root.width} />
              ))}
            </g>

            <g className="tree__branches">
              {tree.branches.map((b) => (
                <path
                  key={b.id}
                  d={b.d}
                  pathLength={1}
                  strokeWidth={Math.max(0.8, b.width)}
                  style={{ '--depth': b.depth } as CSSProperties}
                />
              ))}
            </g>

            <g className="tree__leaves">
              {tree.leafPaths.map((d, i) => (
                <path key={i} d={d} className={`tree__leaf-group tree__leaf-group--${i}`} />
              ))}
            </g>

            {active && (
              <path key={active.index} className="tree__trail" d={active.trail} pathLength={1} />
            )}
          </svg>

          <ol className="tree__spots">
            {memories.map((memory, i) => {
              const spot = tree.spots[i];
              if (!spot) return null;
              const near =
                activeSpot &&
                active?.index !== i &&
                Math.hypot(spot.x - activeSpot.x, spot.y - activeSpot.y) < 220;
              const date = formatDate(memory.date, experience.locale);
              return (
                <li
                  key={memory.id}
                  className="tree-spot"
                  style={{ left: pct(spot.x), top: pct(spot.y), '--i': i } as CSSProperties}
                  data-active={active?.index === i || undefined}
                  data-near={near || undefined}
                  data-explored={exploredMemories.has(memory.id) || undefined}
                  data-side={spot.x > tree.size / 2 ? 'right' : 'left'}
                >
                  <button type="button" className="tree-spot__button" onClick={(e) => select(i, e)}>
                    <span className="tree-spot__light" aria-hidden="true" />
                    <span className="tree-spot__label">
                      <span className="tree-spot__title">{memory.title}</span>
                      {date && <span className="tree-spot__date">{date}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <details className="tree-scene__list">
        <summary>{strings.memoryList}</summary>
        <ul>
          {memories.map((memory) => (
            <li key={memory.id}>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => openMemory(memory.id)}
              >
                {memory.title}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
