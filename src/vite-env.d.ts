/// <reference types="vite/client" />

declare module 'virtual:afterglow-experiences' {
  /** Lazy loaders for the experiences bundled into this build (see build/afterglow-plugin.ts). */
  export const experienceLoaders: Record<string, () => Promise<unknown>>;
  /** Experience opened at the site root, from AFTERGLOW_DEFAULT_EXPERIENCE. */
  export const defaultExperience: string | null;
}
