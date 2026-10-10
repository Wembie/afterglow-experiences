import type { SceneDefinition } from './schema';

/** Music in effect at a scene: the latest `music` declared up to and including it. */
export function effectiveMusic(scenes: SceneDefinition[], index: number): string | null {
  for (let i = index; i >= 0; i--) {
    const music = scenes[i]?.music;
    if (music !== undefined) return music;
  }
  return null;
}

export function sceneLabel(scene: { navLabel?: string; title?: string; id: string }): string {
  return scene.navLabel ?? scene.title ?? scene.id;
}
