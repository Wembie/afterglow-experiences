/**
 * Isa — Un universo propio.
 *
 * Everything personal lives in this file and in public/experiences/isa/.
 * Entries marked `placeholder: true` are waiting for real content: replace
 * the text, point `photos` at real images, then remove the flag.
 *
 * Remember: whatever is published here is public. Only include what Isa
 * would be happy to see on the open web.
 */
import { defineExperience } from '../../engine/define';

const placeholderPhoto = (n: number, alt: string, size: [number, number]) => ({
  src: `photos/placeholder-${String(n).padStart(2, '0')}.svg`,
  alt,
  width: size[0],
  height: size[1],
});

export default defineExperience({
  schemaVersion: 1,
  id: 'isa-birthday',
  slug: 'isa',
  locale: 'es',
  meta: {
    title: 'Isa — Un universo propio',
    description: 'Una dedicatoria de cumpleaños hecha de recuerdos.',
  },
  recipient: { name: 'Isa' },
  creator: { name: '', signature: '— con cariño, siempre' },
  occasion: { type: 'birthday', title: 'Un universo propio' },
  relationship: { type: 'friendship', label: 'Mejor amistad' },
  theme: { base: 'cosmic-night' },

  assets: {
    images: {
      'placeholder-01': placeholderPhoto(
        1,
        'Imagen provisional: luz cálida sobre fondo nocturno',
        [1200, 900],
      ),
      'placeholder-02': placeholderPhoto(2, 'Imagen provisional: destellos violeta', [900, 1200]),
      'placeholder-03': placeholderPhoto(3, 'Imagen provisional: horizonte dorado', [1200, 1200]),
      'placeholder-04': placeholderPhoto(4, 'Imagen provisional: bruma azul', [1200, 800]),
      'placeholder-05': placeholderPhoto(5, 'Imagen provisional: luz rosada', [900, 1200]),
      'placeholder-06': placeholderPhoto(6, 'Imagen provisional: jardín de luces', [1200, 900]),
      // Example of a real photo once added to public/experiences/isa/photos/:
      // 'primer-dia': {
      //   src: 'photos/primer-dia.webp',
      //   alt: 'Isa riendo frente a la pantalla',
      //   width: 1600, height: 1200,
      //   focalPoint: { x: 40, y: 35 },
      //   caption: 'El día que todo empezó',
      // },
    },
  },

  audio: {
    // Generative pads are synthesised in the browser: no files, no licensing issues.
    // To use your own music, add e.g.:
    // theme: { source: 'file', src: 'audio/nuestra-cancion.mp3', kind: 'music', credit: 'Autor — Licencia' },
    tracks: {
      night: { source: 'generative', preset: 'night-pad' },
      warm: { source: 'generative', preset: 'warm-pad' },
      garden: { source: 'generative', preset: 'garden-pad' },
    },
    effects: true,
    spatial: true,
  },

  categories: [
    { id: 'primeros', label: 'Primeros momentos' },
    { id: 'aventuras', label: 'Aventuras' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'risas', label: 'Risas' },
    { id: 'conversaciones', label: 'Conversaciones' },
    { id: 'cumple', label: 'Cumpleaños' },
  ],

  memories: [
    {
      id: 'como-empezo',
      title: 'Cómo empezó todo',
      category: 'primeros',
      description:
        'Escribe aquí cómo se conocieron: dónde estaban, qué fue lo primero que pensaste de ella.',
      message: 'Una frase corta solo para ella.',
      photos: ['placeholder-01', 'placeholder-02'],
      placeholder: true,
    },
    {
      id: 'primera-partida',
      title: 'Nuestra primera partida',
      category: 'gaming',
      description: 'El juego, el equipo, el momento que todavía recuerdan.',
      photos: ['placeholder-03'],
      placeholder: true,
    },
    {
      id: 'una-aventura',
      title: 'Una aventura',
      category: 'aventuras',
      description: 'Un lugar al que fueron, o uno al que se escaparon con la imaginación.',
      photos: ['placeholder-04'],
      placeholder: true,
    },
    {
      id: 'ataque-de-risa',
      title: 'El ataque de risa',
      category: 'risas',
      description: 'Ese momento que no tiene sentido para nadie más.',
      photos: ['placeholder-05'],
      placeholder: true,
    },
    {
      id: 'una-conversacion',
      title: 'Una conversación importante',
      category: 'conversaciones',
      description: 'La noche en que hablaron de verdad. Solo lo que ella querría ver publicado.',
      photos: [],
      placeholder: true,
    },
    {
      id: 'un-cumple',
      title: 'Un cumpleaños compartido',
      category: 'cumple',
      description: 'Un cumpleaños que celebraron, o el primero que vas a celebrar con ella.',
      photos: ['placeholder-06'],
      placeholder: true,
    },
  ],

  timeline: [
    {
      id: 't-inicio',
      title: 'El comienzo',
      description: 'Añade la fecha real (día, mes o solo el año) o déjala aproximada.',
      memoryId: 'como-empezo',
      placeholder: true,
    },
    {
      id: 't-juego',
      title: 'El primer juego compartido',
      memoryId: 'primera-partida',
      placeholder: true,
    },
    {
      id: 't-algo-importante',
      title: 'Un momento importante',
      description: 'Un logro, una decisión, algo que cambió las cosas.',
      placeholder: true,
    },
    {
      id: 't-hoy',
      title: 'Hoy',
      description: 'Otro año de historia compartida.',
      date: { precision: 'approximate', label: 'Hoy' },
    },
  ],

  nicknames: [
    {
      id: 'apodo',
      name: 'Isa',
      kind: 'nickname',
      explanation:
        'Añade aquí sus apodos, sus usuarios de juegos y los chistes internos que quieran compartir.',
      placeholder: true,
    },
    {
      id: 'usuario',
      name: 'su_usuario',
      kind: 'username',
      explanation: 'Su nombre en el juego donde se encontraron.',
      placeholder: true,
    },
    {
      id: 'frase',
      name: 'Nuestra frase',
      kind: 'inside-joke',
      explanation: 'La frase que solo ustedes entienden.',
      placeholder: true,
    },
  ],

  messages: [
    {
      id: 'carta',
      kind: 'letter',
      title: 'Para ti',
      body: 'Este es el lugar para tu carta.\n\nEscríbela con tus palabras: lo que significa tenerla cerca, lo que han vivido, lo que le deseas para este nuevo año.\n\nPuede ser larga o corta. Lo importante es que suene a ti.',
      signature: '— tu nombre',
      reveal: 'fade',
      placeholder: true,
    },
    {
      id: 'cumple',
      kind: 'birthday',
      body: 'Hoy celebramos que existes, y todo lo que hace más brillante.',
      reveal: 'words',
    },
    {
      id: 'cierre',
      kind: 'closing',
      body: 'Gracias por ser parte de mis historias favoritas.\n\nQue este año te encuentre con mucha luz.',
      reveal: 'lines',
    },
  ],

  scenes: [
    {
      id: 'llegada',
      type: 'arrival',
      navLabel: 'Llegada',
      theme: 'cosmic-night',
      particles: 'quiet',
      music: 'night',
      lines: [
        'Algunas personas se vuelven parte de nuestras historias favoritas.',
        'Y otras se convierten en un pequeño mundo propio.',
      ],
      invitation: 'Entra a tu universo',
      audioPrompt: {
        question: '¿Activamos la música?',
        accept: 'Sí, con música',
        decline: 'En silencio',
      },
      description: 'Un cielo nocturno en calma con una sola luz en el centro.',
    },
    {
      id: 'recuerdos',
      type: 'memories',
      title: 'Recuerdos que todavía brillan',
      subtitle: 'Toca cualquiera para volver a ese momento.',
      navLabel: 'Recuerdos',
      theme: 'golden-hour',
      music: 'warm',
      transition: 'bloom',
      description: 'Fotografías flotando con luz cálida de atardecer.',
    },
    {
      id: 'historia',
      type: 'timeline',
      title: 'Nuestra historia',
      subtitle: 'Algunos puntos del camino.',
      navLabel: 'Historia',
      theme: 'cosmic-night',
      transition: 'rise',
    },
    {
      id: 'arbol',
      type: 'tree',
      title: 'El árbol de los recuerdos',
      subtitle: 'Cada luz es algo que hemos vivido.',
      prompt: 'Toca una luz.',
      navLabel: 'El árbol',
      theme: 'memory-garden',
      music: 'garden',
      transition: 'bloom',
      description:
        'Un árbol luminoso con raíces brillantes; cada luz entre sus ramas es un recuerdo que se puede abrir.',
    },
    {
      id: 'nombres',
      type: 'names',
      title: 'Nombres que solo entendemos tú y yo',
      navLabel: 'Nombres',
      theme: 'cosmic-night',
      music: 'night',
    },
    {
      id: 'constelacion',
      type: 'constellation',
      title: 'Nuestra constelación',
      subtitle: 'Las líneas se encienden a medida que recuerdas.',
      navLabel: 'Constelación',
      theme: 'cosmic-night',
      particles: 'cosmic',
      description: 'Un cielo con estrellas conectadas; cada estrella es un recuerdo.',
    },
    {
      id: 'carta',
      type: 'message',
      messageId: 'carta',
      subtitle: 'Una carta',
      navLabel: 'Carta',
      theme: 'quiet-ending',
      particles: 'quiet',
      transition: 'rise',
    },
    {
      id: 'cumpleanos',
      type: 'celebration',
      headline: 'Feliz cumpleaños',
      messageId: 'cumple',
      navLabel: 'Cumpleaños',
      theme: 'birthday-finale',
      music: 'warm',
      palette: ['#FFD99A', '#F1A6CF', '#B9AEFF', '#F5F1FF'],
      transition: 'bloom',
      description:
        'Las luces del recorrido se reúnen y el cielo se abre en una celebración luminosa.',
    },
    {
      id: 'cierre',
      type: 'closing',
      title: 'Siempre un poquito de luz',
      messageId: 'cierre',
      navLabel: 'Cierre',
      theme: 'quiet-ending',
      music: 'night',
      actions: ['replay', 'tree', 'letter', 'celebration'],
    },
  ],
});
