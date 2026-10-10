import type { UiStrings } from './schema';

const en: UiStrings = {
  next: 'Continue',
  previous: 'Back',
  close: 'Close',
  skipIntro: 'Skip intro',
  openMemory: 'Open memory',
  memoryList: 'All memories',
  photoOf: 'Photo {current} of {total}',
  nextPhoto: 'Next photo',
  previousPhoto: 'Previous photo',
  sceneIndex: 'Chapters',
  settings: 'Settings',
  sound: 'Sound',
  soundOn: 'Turn sound on',
  soundOff: 'Mute sound',
  masterVolume: 'Volume',
  musicVolume: 'Music',
  effectsVolume: 'Effects',
  effects: 'Interaction sounds',
  motion: 'Motion',
  motionSystem: 'Follow system',
  motionFull: 'Full',
  motionReduced: 'Reduced',
  quality: 'Visual quality',
  qualityAuto: 'Auto',
  qualityHigh: 'High',
  qualityLow: 'Light',
  readingMode: 'Show text without animation',
  replay: 'Start again',
  revisitMemories: 'Revisit the memories',
  returnToTree: 'Return to the tree',
  openLetter: 'Read the letter again',
  viewCelebration: 'See the dedication again',
  continue: 'Continue',
  skipAnimation: 'Show everything',
  missingPhoto: 'This photo is still on its way',
  undated: 'Sometime, somewhere',
  progress: 'Chapter {current} of {total}',
  loading: 'Gathering the light…',
  errorTitle: 'This little world could not open',
  errorBody: 'Something in its configuration is not quite right. Please try again later.',
  explored: '{count} of {total} explored',
};

const es: UiStrings = {
  next: 'Continuar',
  previous: 'Atrás',
  close: 'Cerrar',
  skipIntro: 'Saltar intro',
  openMemory: 'Abrir recuerdo',
  memoryList: 'Todos los recuerdos',
  photoOf: 'Foto {current} de {total}',
  nextPhoto: 'Foto siguiente',
  previousPhoto: 'Foto anterior',
  sceneIndex: 'Capítulos',
  settings: 'Ajustes',
  sound: 'Sonido',
  soundOn: 'Activar sonido',
  soundOff: 'Silenciar',
  masterVolume: 'Volumen',
  musicVolume: 'Música',
  effectsVolume: 'Efectos',
  effects: 'Sonidos de interacción',
  motion: 'Movimiento',
  motionSystem: 'Según el sistema',
  motionFull: 'Completo',
  motionReduced: 'Reducido',
  quality: 'Calidad visual',
  qualityAuto: 'Automática',
  qualityHigh: 'Alta',
  qualityLow: 'Ligera',
  readingMode: 'Mostrar textos sin animación',
  replay: 'Volver a empezar',
  revisitMemories: 'Volver a los recuerdos',
  returnToTree: 'Volver al árbol',
  openLetter: 'Leer la carta otra vez',
  viewCelebration: 'Ver la dedicatoria otra vez',
  continue: 'Continuar',
  skipAnimation: 'Mostrar todo',
  missingPhoto: 'Esta foto todavía viene en camino',
  undated: 'En algún momento',
  progress: 'Capítulo {current} de {total}',
  loading: 'Reuniendo la luz…',
  errorTitle: 'Este pequeño mundo no pudo abrirse',
  errorBody: 'Algo en su configuración no está bien. Inténtalo de nuevo más tarde.',
  explored: '{count} de {total} explorados',
};

const byLanguage: Record<string, UiStrings> = { en, es };

export function resolveStrings(locale: string, overrides: Partial<UiStrings>): UiStrings {
  const language = locale.toLowerCase().split('-')[0] ?? 'en';
  return { ...(byLanguage[language] ?? en), ...overrides };
}

/** Replaces {name} placeholders. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
