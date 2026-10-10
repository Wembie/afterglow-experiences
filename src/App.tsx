import { useEffect, useState } from 'react';
import { defaultExperience, experienceLoaders } from 'virtual:afterglow-experiences';
import { ExperienceRunner } from './engine/ExperienceRunner';
import { buildHash, navigate, useHashRoute } from './engine/router';
import type { Experience } from './engine/schema';
import { resolveStrings } from './engine/strings';

type LoadState =
  | { status: 'loading'; slug: string }
  | { status: 'ready'; slug: string; experience: Experience }
  | { status: 'invalid'; slug: string; errors: string[] }
  | { status: 'missing'; slug: string };

export function App() {
  const route = useHashRoute();
  const slug = route.slug ?? defaultExperience;

  if (!slug) return <Lobby />;
  return <ExperienceLoader key={slug} slug={slug} sceneId={route.slug ? route.sceneId : null} />;
}

function ExperienceLoader({ slug, sceneId }: { slug: string; sceneId: string | null }) {
  const load = experienceLoaders[slug];
  const [loaded, setState] = useState<LoadState>({ status: 'loading', slug });
  const state: LoadState = load ? loaded : { status: 'missing', slug };

  useEffect(() => {
    let cancelled = false;
    if (!load) return;
    // The validator (zod) loads in parallel with the content, off the critical chunk.
    Promise.all([load(), import('./engine/validate')])
      .then(([input, { validateExperience }]) => {
        if (cancelled) return;
        const result = validateExperience(input);
        if (result.ok) setState({ status: 'ready', slug, experience: result.experience });
        else {
          if (import.meta.env.DEV) console.error('[afterglow] invalid experience', result.errors);
          setState({ status: 'invalid', slug, errors: result.errors });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({ status: 'invalid', slug, errors: [String(error)] });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, load]);

  const redirectToDefault =
    state.status === 'missing' && Boolean(defaultExperience) && slug !== defaultExperience;
  useEffect(() => {
    // A stale or mistyped link: fall back to this deployment's experience.
    if (redirectToDefault && defaultExperience) navigate(defaultExperience, null, true);
  }, [redirectToDefault]);

  if (state.status === 'ready') {
    return <ExperienceRunner experience={state.experience} sceneId={sceneId} />;
  }

  const strings = resolveStrings(navigator.language || 'en', {});
  if (state.status === 'loading') {
    return (
      <>
        <div className="sky" aria-hidden="true" />
        <div className="app-status" role="status">
          <div className="app-status__inner">
            <span className="loading-glow" aria-hidden="true" />
            <span className="sr-only">{strings.loading}</span>
          </div>
        </div>
      </>
    );
  }

  if (redirectToDefault) return null;

  return (
    <>
      <div className="sky" aria-hidden="true" />
      <main className="app-status">
        <div className="app-status__inner" role="alert">
          <h1 className="display" style={{ fontSize: 'var(--text-2xl)' }}>
            {strings.errorTitle}
          </h1>
          <p className="prose" style={{ margin: '0 auto' }}>
            {strings.errorBody}
          </p>
          {/* Configuration details only during development. */}
          {import.meta.env.DEV && state.status === 'invalid' && (
            <pre className="app-status__errors">{state.errors.join('\n')}</pre>
          )}
          {import.meta.env.DEV && state.status === 'missing' && (
            <pre className="app-status__errors">
              {`No experience "${state.slug}". Available: ${Object.keys(experienceLoaders).join(', ')}`}
            </pre>
          )}
        </div>
      </main>
    </>
  );
}

/** Shown only when a build bundles several experiences and none is the default. */
function Lobby() {
  const slugs = Object.keys(experienceLoaders);
  return (
    <>
      <div className="sky" aria-hidden="true" />
      <main className="app-status">
        <div className="app-status__inner">
          <p className="eyebrow">Afterglow</p>
          <h1 className="display" style={{ fontSize: 'var(--text-3xl)' }}>
            Every memory leaves a little light behind.
          </h1>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--space-2)' }}>
            {slugs.map((slug) => (
              <li key={slug}>
                <a className="btn" href={buildHash(slug)}>
                  {slug}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
