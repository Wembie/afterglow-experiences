import { defineConfig, devices } from '@playwright/test';

/**
 * Browser journeys run against a real production build served under a
 * non-root base path, exactly like GitHub Pages serves it.
 */
const BASE_PATH = '/mejoramigaisa/';
const PORT = 4179;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 740 } } },
  ],
  webServer: {
    command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AFTERGLOW_BASE_PATH: BASE_PATH,
      AFTERGLOW_EXPERIENCES: 'isa,friend-example',
      AFTERGLOW_DEFAULT_EXPERIENCE: 'isa',
    },
  },
});
