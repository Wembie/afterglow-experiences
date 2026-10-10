import { createContext, useContext } from 'react';
import type { Experience, ImageAsset, Memory, SceneDefinition, UiStrings } from './schema';

export interface ExperienceRuntime {
  experience: Experience;
  strings: UiStrings;
  reducedMotion: boolean;
  readingMode: boolean;
  scenes: SceneDefinition[];
  sceneIndex: number;
  goToScene: (sceneId: string) => void;
  next: () => void;
  previous: () => void;
  /** Opens a memory; `origin` (viewport px) positions sound and light effects. */
  openMemory: (memoryId: string, origin?: { x: number; y: number }) => void;
  /** Memories opened during this visit (not persisted). */
  exploredMemories: ReadonlySet<string>;
  /** True once the visitor passed the arrival (or deep-linked past it). */
  entered: boolean;
  markEntered: () => void;
  getImage: (imageId: string | undefined) => ImageAsset | undefined;
  getMemory: (memoryId: string) => Memory | undefined;
}

export const ExperienceContext = createContext<ExperienceRuntime | null>(null);

export function useExperience(): ExperienceRuntime {
  const runtime = useContext(ExperienceContext);
  if (!runtime) throw new Error('useExperience must be used inside an ExperienceRunner');
  return runtime;
}

/** Resolves a scene's memory selection: explicit ids in order, or all memories. */
export function selectMemories(experience: Experience, ids: string[] | undefined): Memory[] {
  if (!ids) return experience.memories;
  const byId = new Map(experience.memories.map((m) => [m.id, m]));
  return ids.map((id) => byId.get(id)).filter((m): m is Memory => Boolean(m));
}

export function selectById<T extends { id: string }>(items: T[], ids: string[] | undefined): T[] {
  if (!ids) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}
