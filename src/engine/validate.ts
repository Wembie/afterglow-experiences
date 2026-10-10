import { experienceSchema, type Experience } from './schema';

export type ValidationResult =
  { ok: true; experience: Experience } | { ok: false; errors: string[] };

/** Validates untrusted experience data and returns readable error paths. */
export function validateExperience(input: unknown): ValidationResult {
  const result = experienceSchema.safeParse(input);
  if (result.success) return { ok: true, experience: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    }),
  };
}
