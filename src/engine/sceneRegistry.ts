/**
 * Maps scene types to renderers. Heavier scenes are code-split so a visitor
 * only downloads what their experience uses, when they reach it.
 */
import { lazy, type ComponentType } from 'react';
import ArrivalScene from '../scenes/ArrivalScene';
import type { SceneDefinition, SceneType } from './schema';

type AnySceneComponent = ComponentType<{ scene: never }>;
type Loader = () => Promise<{ default: AnySceneComponent }>;

const loaders: Record<Exclude<SceneType, 'arrival'>, Loader> = {
  memories: () => import('../scenes/MemoriesScene'),
  tree: () => import('../scenes/TreeScene'),
  constellation: () => import('../scenes/ConstellationScene'),
  timeline: () => import('../scenes/TimelineScene'),
  names: () => import('../scenes/NamesScene'),
  message: () => import('../scenes/MessageScene'),
  celebration: () => import('../scenes/CelebrationScene'),
  closing: () => import('../scenes/ClosingScene'),
};

const registry = new Map<string, AnySceneComponent>([
  // The first impression is never behind a network request.
  ['arrival', ArrivalScene as AnySceneComponent],
  ...Object.entries(loaders).map(
    ([type, load]) => [type, lazy(load) as unknown as AnySceneComponent] as const,
  ),
]);

/** Returns the renderer for a scene, or null for an unknown type. */
export function getSceneComponent(
  scene: SceneDefinition,
): ComponentType<{ scene: SceneDefinition }> | null {
  return (
    (registry.get(scene.type) as ComponentType<{ scene: SceneDefinition }> | undefined) ?? null
  );
}

/** Fetches a scene's code ahead of time (e.g. the next scene while reading this one). */
export function preloadScene(scene: SceneDefinition | undefined): void {
  if (!scene || scene.type === 'arrival') return;
  const load = loaders[scene.type as Exclude<SceneType, 'arrival'>];
  void load?.().catch(() => {});
}
