/**
 * A deliberately different example: English, a farewell, fewer scenes, a
 * different order and no birthday. It exists to prove the engine assumes
 * nothing about the occasion — copy it as a starting point.
 */
import { defineExperience } from '../../engine/define';

export default defineExperience({
  schemaVersion: 1,
  id: 'friend-farewell-example',
  slug: 'friend-example',
  locale: 'en',
  meta: { title: 'For Sam — Until Next Time' },
  recipient: { name: 'Sam' },
  occasion: { type: 'farewell', title: 'Until next time' },
  relationship: { type: 'friendship' },
  theme: { base: 'quiet-ending' },
  navigation: { showProgress: true, showSceneIndex: false },
  audio: {
    tracks: { calm: { source: 'generative', preset: 'night-pad' } },
  },
  memories: [
    {
      id: 'first',
      title: 'A first memory',
      date: { precision: 'year', year: 2020 },
      description: 'Replace this with a real memory.',
      placeholder: true,
    },
    {
      id: 'second',
      title: 'Another one',
      date: { precision: 'month', year: 2022, month: 6 },
      placeholder: true,
    },
    {
      id: 'third',
      title: 'And one more',
      placeholder: true,
    },
  ],
  messages: [
    {
      id: 'goodbye',
      kind: 'closing',
      body: 'Wherever you go next, a little of this light goes with you.',
      reveal: 'light-sweep',
    },
  ],
  scenes: [
    {
      id: 'arrival',
      type: 'arrival',
      music: 'calm',
      lines: ['Some goodbyes are really just a change of sky.'],
      invitation: 'Come in',
      audioPrompt: { question: 'Play some sound?', accept: 'Yes', decline: 'Not now' },
    },
    {
      id: 'sky',
      type: 'constellation',
      title: 'Points of light',
      prompt: 'Tap a star.',
      theme: 'cosmic-night',
      particles: 'cosmic',
    },
    {
      id: 'goodbye',
      type: 'closing',
      title: 'Until next time',
      messageId: 'goodbye',
      actions: ['replay', 'memories'],
    },
  ],
});
