import type { ExperienceInput } from '../engine/schema';
import { validateExperience } from '../engine/validate';

/** The smallest valid experience: one arrival scene. */
export function minimalExperience(): ExperienceInput & { scenes: ExperienceInput['scenes'] } {
  return {
    schemaVersion: 1,
    id: 'test',
    slug: 'test',
    meta: { title: 'Test' },
    recipient: { name: 'Robin' },
    occasion: { type: 'milestone', title: 'Test' },
    relationship: { type: 'friendship' },
    memories: [{ id: 'm0', title: 'Un recuerdo' }],
    scenes: [{ id: 'hello', type: 'arrival', lines: ['Hola.'], invitation: 'Entrar' }],
  };
}

/** A small experience exercising memories, galleries and navigation. */
export function storyExperience() {
  const input: ExperienceInput = {
    schemaVersion: 1,
    id: 'story',
    slug: 'story',
    locale: 'es',
    meta: { title: 'Historia de prueba' },
    recipient: { name: 'Robin' },
    occasion: { type: 'birthday', title: 'Prueba' },
    relationship: { type: 'friendship' },
    assets: {
      images: {
        a: { src: 'photos/a.webp', alt: 'Foto A', width: 4, height: 3, caption: 'Pie A' },
        b: { src: 'photos/b.webp', alt: 'Foto B' },
      },
    },
    audio: { tracks: { pad: { source: 'generative', preset: 'night-pad' } } },
    memories: [
      {
        id: 'm1',
        title: 'Primer recuerdo',
        description: 'Descripción uno',
        photos: ['a', 'b'],
        message: 'Nota',
      },
      { id: 'm2', title: 'Segundo recuerdo' },
    ],
    messages: [
      { id: 'letter', kind: 'letter', body: 'Querida Robin.\n\nGracias.', reveal: 'words' },
    ],
    scenes: [
      {
        id: 'hello',
        type: 'arrival',
        lines: ['Hola.'],
        invitation: 'Entrar',
        music: 'pad',
        audioPrompt: { question: '¿Música?', accept: 'Sí', decline: 'No' },
      },
      { id: 'memories', type: 'memories', title: 'Recuerdos' },
      { id: 'tree', type: 'tree', title: 'Árbol' },
      { id: 'letter', type: 'message', messageId: 'letter', title: 'Carta' },
      { id: 'end', type: 'closing', title: 'Fin', actions: ['replay', 'tree'] },
    ],
  };
  const result = validateExperience(input);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.experience;
}
