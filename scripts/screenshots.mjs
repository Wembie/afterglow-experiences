#!/usr/bin/env node
/**
 * Captures every scene of an experience at several viewport sizes for visual QA.
 *
 *   npm run build && npx vite preview --port 4180 &
 *   node scripts/screenshots.mjs http://localhost:4180/ isa docs/screenshots recuerdos
 *
 * Runs with reduced motion so each capture shows the settled composition.
 */
/* global document -- used inside page.waitForFunction callbacks */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const [
  baseUrl = 'http://localhost:4180/',
  slug = 'isa',
  outDir = 'docs/screenshots',
  memoryScene = 'recuerdos',
  only,
] = process.argv.slice(2);

const viewports = [
  { name: 'mobile-375', width: 375, height: 760 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const errors = [];

for (const vp of viewports) {
  if (only && !vp.name.includes(only)) continue;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: process.env.MOTION === 'full' ? 'no-preference' : 'reduce',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('console', (msg) => msg.type() === 'error' && errors.push(`${vp.name}: ${msg.text()}`));
  page.on('pageerror', (err) => errors.push(`${vp.name}: ${err.message}`));

  await page.goto(`${baseUrl}#/${slug}`);
  await page.waitForSelector('[data-scene]');

  // Walk the story with the visible "continue" control, like a visitor would.
  let index = 0;
  for (;;) {
    await page.waitForTimeout(900);
    const id = await page.getAttribute('[data-scene]', 'data-scene');
    await page.screenshot({
      path: `${outDir}/${vp.name}-${String(index).padStart(2, '0')}-${id}.png`,
      fullPage: true,
    });
    if (index === 0) {
      const invite = page.locator('.arrival__invite');
      await invite.click();
      const decline = page.locator('.arrival__audio .btn:not(.btn--primary)');
      if (await decline.count()) await decline.click();
    } else {
      const next = page.locator('.scene-nav__next');
      if (!(await next.count())) break;
      await next.click();
    }
    await page.waitForFunction(
      (prev) => document.querySelector('[data-scene]')?.getAttribute('data-scene') !== prev,
      id,
    );
    index++;
    if (index > 30) break;
  }

  // An opened memory.
  await page.goto(`${baseUrl}#/${slug}/${memoryScene}`);
  await page.waitForSelector('.print__button');
  await page.locator('.print__button').first().click();
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/${vp.name}-memory-dialog.png` });
  await context.close();
}

await browser.close();
if (errors.length) {
  console.error('Console errors:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Screenshots written to ${outDir}`);
}
