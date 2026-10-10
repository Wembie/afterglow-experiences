import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any console error or uncaught exception. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function sceneId(page: Page) {
  return page.locator('[data-scene]').getAttribute('data-scene');
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe('Journey A + D: first visit, without audio', () => {
  test('travels from the arrival to the closing scene and replays', async ({ page }) => {
    const errors = watchConsole(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // The bare base path opens the default experience: wembie.github.io/mejoramigaisa/
    await page.goto('./');
    await expect(page.getByText('Algunas personas se vuelven parte')).toBeVisible();
    await expect(page).toHaveURL(/#\/isa\/llegada$/);

    await page.getByRole('button', { name: 'Entra a tu universo' }).click();
    await page.getByRole('button', { name: 'En silencio' }).click();
    await expect.poll(() => sceneId(page)).toBe('recuerdos');
    await expect(page.getByRole('button', { name: 'Activar sonido' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    const visited = ['recuerdos'];
    for (let i = 0; i < 12; i++) {
      const next = page.locator('.scene-nav__next');
      if ((await next.count()) === 0) break;
      const before = await sceneId(page);
      await next.click();
      await expect.poll(() => sceneId(page)).not.toBe(before);
      visited.push((await sceneId(page)) ?? '');
      await expectNoHorizontalOverflow(page);
    }
    expect(visited).toContain('cumpleanos');
    expect(visited.at(-1)).toBe('cierre');

    await page.getByRole('button', { name: 'Volver a empezar' }).click();
    await expect.poll(() => sceneId(page)).toBe('llegada');
    expect(errors).toEqual([]);
  });

  test('skip intro is available immediately with full motion', async ({ page }) => {
    await page.goto('./#/isa');
    await page.getByRole('button', { name: 'Saltar intro' }).click();
    await expect.poll(() => sceneId(page)).toBe('recuerdos');
  });
});

test.describe('Journey B: memory exploration', () => {
  test('opens memories from the tree, browses photos and returns', async ({ page }) => {
    const errors = watchConsole(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./#/isa/arbol');

    const lights = page.locator('.tree-spot__button');
    await expect(lights).toHaveCount(6);
    await page
      .getByRole('button', { name: /Cómo empezó todo/ })
      .first()
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Cómo empezó todo');
    await expect(dialog).toContainText('Foto 1 de 2');
    await dialog.getByRole('button', { name: 'Foto siguiente' }).click();
    await expect(dialog).toContainText('Foto 2 de 2');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await page
      .getByRole('button', { name: /Una aventura/ })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toContainText('Una aventura');
    await page.getByRole('button', { name: 'Cerrar' }).click();
    await expect(page.getByText('2 de 6 explorados')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Journey C: mobile', () => {
  test('has no horizontal overflow on any scene', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const scene of [
      'llegada',
      'recuerdos',
      'historia',
      'arbol',
      'nombres',
      'constelacion',
      'carta',
      'cumpleanos',
      'cierre',
    ]) {
      await page.goto(`./#/isa/${scene}`);
      await expect.poll(() => sceneId(page)).toBe(scene);
      await page.waitForTimeout(300);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('opens and closes a photograph by touch', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.goto('./#/isa/recuerdos');
    await page.locator('.print__button').first().tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar' }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('Journey E: reduced motion', () => {
  test('shows complete content without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./#/isa/cumpleanos');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.getByRole('heading', { name: 'Isa' })).toBeVisible();
    await expect(page.getByText('Hoy celebramos que existes')).toBeVisible();
    await page.goto('./#/isa/carta');
    await expect(page.locator('.reveal--instant')).toHaveCount(1);
  });
});

test.describe('Journey F: missing assets', () => {
  test('shows designed placeholders when photos fail to load', async ({ page }) => {
    const errors = watchConsole(page);
    await page.route('**/experiences/isa/photos/**', (route) => route.fulfill({ status: 404 }));
    await page.goto('./#/isa/recuerdos');
    await expect(page.getByTestId('photo-missing').first()).toBeVisible();
    await page.locator('.print__button').first().click();
    await expect(page.getByRole('dialog').getByTestId('photo-missing')).toBeVisible();
    // 404s for the photos are expected; nothing else may fail.
    expect(errors.filter((e) => !e.includes('404'))).toEqual([]);
  });
});

test.describe('Base path and multiple experiences', () => {
  test('serves assets under the repository base path', async ({ page, baseURL }) => {
    const response = await page.request.get(`${baseURL}experiences/isa/photos/placeholder-01.svg`);
    expect(response.status()).toBe(200);
    await page.goto('./#/friend-example');
    await expect(page.getByText('Some goodbyes are really just a change of sky.')).toBeVisible();
  });

  test('redirects unknown experiences to the default one', async ({ page }) => {
    await page.goto('./#/nobody');
    await expect(page).toHaveURL(/#\/isa\/llegada$/);
  });
});
