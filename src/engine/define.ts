import type { ExperienceInput } from './schema';

/**
 * Typed helper for experience files: autocompletion and type errors while
 * authoring, without pulling the validator into the experience chunk.
 */
export function defineExperience(input: ExperienceInput): ExperienceInput {
  return input;
}
