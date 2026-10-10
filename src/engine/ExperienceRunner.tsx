import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioProvider, useAudio } from '../audio/AudioContext';
import { Controls, SceneNav } from '../components/Chrome';
import { MemoryDialog } from '../components/MemoryDialog';
import { ParticleField, useParticles } from '../particles/ParticleField';
import { resolveQuality, usePreferences, useReducedMotion } from '../preferences/preferences';
import { resolveTheme, themes, themeToCssVars } from '../theme/themes';
import { ErrorBoundary } from './ErrorBoundary';
import { ExperienceContext, type ExperienceRuntime } from './ExperienceContext';
import { navigate } from './router';
import { getSceneComponent, preloadScene } from './sceneRegistry';
import type { Experience } from './schema';
import { effectiveMusic } from './scenes';
import { resolveStrings } from './strings';
import './runner.css';

const LEAVE_MS = 280;

interface Props {
  experience: Experience;
  sceneId: string | null;
}

export function ExperienceRunner(props: Props) {
  return (
    <AudioProvider experience={props.experience}>
      <RunnerWithAudio {...props} />
    </AudioProvider>
  );
}

function RunnerWithAudio({ experience, sceneId }: Props) {
  const reducedMotion = useReducedMotion();
  const prefs = usePreferences();
  const quality = resolveQuality(prefs.quality);
  const scenes = experience.scenes;

  const requestedIndex = Math.max(
    0,
    scenes.findIndex((s) => s.id === sceneId),
  );
  // Unknown or missing scene ids resolve to the first scene, and the URL is corrected.
  useEffect(() => {
    const target = scenes[requestedIndex];
    if (target && sceneId !== target.id) navigate(experience.slug, target.id, true);
  }, [experience.slug, requestedIndex, sceneId, scenes]);

  const scene = scenes[requestedIndex]!;
  const themeName = scene.theme ?? experience.theme.base;
  const theme = useMemo(() => resolveTheme(themeName, experience), [themeName, experience]);

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(themeToCssVars(theme)))
      root.style.setProperty(key, value);
    root.dataset.theme = themeName;
  }, [theme, themeName]);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
  }, [reducedMotion]);

  useEffect(() => {
    document.title = experience.meta.title;
    document.documentElement.lang = experience.locale;
  }, [experience.meta.title, experience.locale]);

  return (
    <ParticleField
      preset={scene.particles ?? themes[themeName].defaultParticles}
      colors={theme.particles}
      reduced={reducedMotion}
      quality={quality}
    >
      <Stage experience={experience} sceneIndex={requestedIndex} reducedMotion={reducedMotion} />
    </ParticleField>
  );
}

function Stage({
  experience,
  sceneIndex,
  reducedMotion,
}: {
  experience: Experience;
  sceneIndex: number;
  reducedMotion: boolean;
}) {
  const scenes = experience.scenes;
  const prefs = usePreferences();
  const audio = useAudio();
  const particles = useParticles();
  const strings = useMemo(
    () => resolveStrings(experience.locale, experience.strings),
    [experience.locale, experience.strings],
  );

  const [animatedIndex, setDisplayIndex] = useState(sceneIndex);
  // Reduced motion swaps scenes immediately; otherwise leave → swap → enter.
  const displayIndex = reducedMotion ? sceneIndex : animatedIndex;
  // A memory belongs to the scene it was opened from; leaving the scene closes it.
  const [openedMemory, setOpenedMemory] = useState<{ id: string; scene: number } | null>(null);
  const activeMemory = openedMemory?.scene === sceneIndex ? openedMemory.id : null;
  const setActiveMemory = useCallback(
    (id: string | null) => setOpenedMemory(id ? { id, scene: sceneIndex } : null),
    [sceneIndex],
  );
  const [explored, setExplored] = useState<ReadonlySet<string>>(() => new Set());
  // Deep links past the arrival count as entered.
  const [entered, setEntered] = useState(() => scenes[sceneIndex]?.type !== 'arrival');
  const markEntered = useCallback(() => setEntered(true), []);
  const sceneRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  const leaving = !reducedMotion && sceneIndex !== animatedIndex;
  useEffect(() => {
    if (reducedMotion || sceneIndex === animatedIndex) return;
    const timer = window.setTimeout(() => setDisplayIndex(sceneIndex), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [sceneIndex, animatedIndex, reducedMotion]);

  // New scene: start at the top, move focus to its heading for screen readers.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    const target =
      sceneRef.current?.querySelector<HTMLElement>('[data-scene-heading]') ?? sceneRef.current;
    target?.focus({ preventScroll: true });
    preloadScene(scenes[displayIndex + 1]);
  }, [displayIndex, scenes]);

  useEffect(() => {
    preloadScene(scenes[sceneIndex + 1]);
  }, [sceneIndex, scenes]);

  useEffect(() => {
    audio?.playMusic(effectiveMusic(scenes, sceneIndex));
  }, [audio, scenes, sceneIndex]);

  const goToScene = useCallback(
    (id: string) => {
      setActiveMemory(null);
      navigate(experience.slug, id);
    },
    [experience.slug, setActiveMemory],
  );

  const runtime: ExperienceRuntime = useMemo(() => {
    const images = experience.assets.images;
    const memories = new Map(experience.memories.map((m) => [m.id, m]));
    return {
      experience,
      strings,
      reducedMotion,
      readingMode: prefs.readingMode,
      scenes,
      sceneIndex,
      goToScene,
      next: () => {
        const next = scenes[sceneIndex + 1];
        if (next) goToScene(next.id);
      },
      previous: () => {
        const prev = scenes[sceneIndex - 1];
        if (prev) goToScene(prev.id);
      },
      openMemory: (memoryId, origin) => {
        if (!memories.has(memoryId)) return;
        setActiveMemory(memoryId);
        setExplored((prev) => (prev.has(memoryId) ? prev : new Set(prev).add(memoryId)));
        const pan = origin ? (origin.x / window.innerWidth) * 2 - 1 : 0;
        audio?.playEffect('chime', pan);
        if (origin) particles?.burst(origin.x, origin.y, { count: 26, speed: 120, life: 1.2 });
      },
      exploredMemories: explored,
      entered,
      markEntered,
      getImage: (imageId) => (imageId ? images[imageId] : undefined),
      getMemory: (memoryId) => memories.get(memoryId),
    };
  }, [
    experience,
    strings,
    reducedMotion,
    prefs.readingMode,
    scenes,
    sceneIndex,
    goToScene,
    audio,
    particles,
    explored,
    setActiveMemory,
    entered,
    markEntered,
  ]);

  const scene = scenes[displayIndex] ?? scenes[0]!;
  const showChrome = scene.type !== 'arrival' || entered;
  // A registry lookup returning module-level components (stable identities).
  const SceneComponent = useMemo(() => getSceneComponent(scene), [scene]);
  const label = scene.title ?? scene.navLabel ?? scene.id;

  return (
    <ExperienceContext.Provider value={runtime}>
      <div className="sky" aria-hidden="true" />
      {showChrome && <Controls />}
      <main
        ref={sceneRef}
        key={scene.id}
        id="scene"
        className={`scene scene--${scene.type} scene-enter--${scene.transition} ${leaving ? 'scene--leaving' : ''}`}
        data-scene={scene.id}
        aria-label={label}
        aria-describedby={scene.description ? `scene-desc-${scene.id}` : undefined}
        tabIndex={-1}
      >
        {scene.description && (
          <p id={`scene-desc-${scene.id}`} className="sr-only">
            {scene.description}
          </p>
        )}
        <ErrorBoundary
          resetKey={scene.id}
          fallback={() => (
            <div className="scene-fallback">
              <p className="display">{label}</p>
              <p className="prose">{strings.errorBody}</p>
            </div>
          )}
        >
          <Suspense
            fallback={
              <div className="app-status" role="status">
                <span className="loading-glow" aria-hidden="true" />
                <span className="sr-only">{strings.loading}</span>
              </div>
            }
          >
            {SceneComponent ? (
              // eslint-disable-next-line react-hooks/static-components
              <SceneComponent scene={scene} />
            ) : (
              <div className="scene-fallback" role="alert">
                <p className="display">{label}</p>
                <p className="prose">{strings.errorBody}</p>
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
      {showChrome && <SceneNav />}
      <MemoryDialog
        memory={activeMemory ? runtime.getMemory(activeMemory) : undefined}
        onClose={() => setActiveMemory(null)}
      />
    </ExperienceContext.Provider>
  );
}
