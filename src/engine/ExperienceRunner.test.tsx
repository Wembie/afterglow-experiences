import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetPreferencesForTests, setPreferences } from '../preferences/preferences';
import { storyExperience } from '../test/fixtures';
import { ExperienceRunner } from './ExperienceRunner';
import { useHashRoute } from './router';
import type { Experience } from './schema';

function Harness({ experience }: { experience: Experience }) {
  const route = useHashRoute();
  return <ExperienceRunner experience={experience} sceneId={route.sceneId} />;
}

function renderStory(sceneId?: string) {
  const experience = storyExperience();
  act(() => {
    window.location.hash = sceneId ? `#/story/${sceneId}` : '#/story';
  });
  return { experience, ...render(<Harness experience={experience} />) };
}

describe('ExperienceRunner', () => {
  beforeEach(() => {
    resetPreferencesForTests();
    // Reduced motion makes scene swaps immediate and deterministic.
    setPreferences({ motion: 'reduced' });
  });

  it('opens on the first scene and corrects the URL', async () => {
    renderStory();
    expect(await screen.findByText('Hola.')).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/story/hello'));
  });

  it('falls back to the first scene for an unknown scene id', async () => {
    renderStory('does-not-exist');
    expect(await screen.findByText('Hola.')).toBeInTheDocument();
  });

  it('enters without sound and navigates forward and back', async () => {
    const user = userEvent.setup();
    renderStory();
    // jsdom has no Web Audio, so the music question is skipped and the visit stays silent.
    await user.click(await screen.findByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Recuerdos' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(await screen.findByRole('heading', { name: 'Árbol' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Atrás/ }));
    expect(await screen.findByRole('heading', { name: 'Recuerdos' })).toBeInTheDocument();
  });

  it('renders memories from configuration and opens an accessible gallery', async () => {
    const user = userEvent.setup();
    renderStory('memories');
    await user.click(await screen.findByRole('button', { name: /Primer recuerdo/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Primer recuerdo' });
    expect(dialog).toHaveTextContent('Descripción uno');
    expect(dialog).toHaveTextContent('Nota');
    expect(screen.getByRole('img', { name: 'Foto A' })).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Foto 1 de 2');
    expect(dialog).toHaveTextContent('Pie A');

    await user.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByRole('img', { name: 'Foto B' })).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Foto 2 de 2');

    fireEvent.keyDown(screen.getByRole('img', { name: 'Foto B' }), { key: 'ArrowRight' });
    expect(screen.getByRole('img', { name: 'Foto A' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes an open memory when the visitor leaves the scene', async () => {
    const user = userEvent.setup();
    renderStory('memories');
    await user.click(await screen.findByRole('button', { name: /Primer recuerdo/ }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    act(() => {
      window.location.hash = '#/story/letter';
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows a designed fallback when a photo is missing', async () => {
    const user = userEvent.setup();
    renderStory('memories');
    await user.click(await screen.findByRole('button', { name: /Primer recuerdo/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.error(within(dialog).getByRole('img', { name: 'Foto A' }));
    const fallback = await within(dialog).findByTestId('photo-missing');
    expect(fallback).toHaveAttribute('aria-label', 'Foto A');
    expect(fallback).toHaveTextContent('Esta foto todavía viene en camino');
  });

  it('makes every tree memory reachable as a labelled button', async () => {
    const user = userEvent.setup();
    renderStory('tree');
    const lights = await screen.findAllByRole('button', { name: /recuerdo/ });
    expect(lights.length).toBeGreaterThanOrEqual(2);
    await user.click(screen.getAllByRole('button', { name: /Segundo recuerdo/ })[0]!);
    expect(await screen.findByRole('dialog', { name: 'Segundo recuerdo' })).toBeInTheDocument();
  });

  it('shows complete text immediately in reduced motion', async () => {
    renderStory('letter');
    const body = await screen.findByText('Querida Robin.');
    expect(body.closest('.reveal')).toHaveClass('reveal--instant');
    expect(screen.getByText('Gracias.')).toBeInTheDocument();
  });

  it('animates text word by word when motion is allowed, without losing content', async () => {
    setPreferences({ motion: 'full' });
    renderStory('letter');
    const article = await screen.findByRole('article');
    expect(article.querySelectorAll('.reveal__word').length).toBe(3);
    expect(article).toHaveTextContent('Querida Robin.');
    expect(screen.getByRole('button', { name: 'Mostrar todo' })).toBeInTheDocument();
  });

  it('closing actions return to earlier scenes', async () => {
    const user = userEvent.setup();
    renderStory('end');
    await user.click(await screen.findByRole('button', { name: 'Volver al árbol' }));
    expect(await screen.findByRole('heading', { name: 'Árbol' })).toBeInTheDocument();
  });

  it('survives an unknown scene type with a graceful fallback', async () => {
    const experience = storyExperience();
    const broken = {
      ...experience,
      scenes: [{ id: 'odd', type: 'karaoke', transition: 'none' }, ...experience.scenes],
    } as unknown as Experience;
    act(() => {
      window.location.hash = '#/story/odd';
    });
    render(<Harness experience={broken} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo en su configuración');
  });
});
