/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { listExperienceSlugs, readAfterglowEnv } from './build/afterglow-env.ts';
import { afterglowPlugin } from './build/afterglow-plugin.ts';

export default defineConfig(({ mode }) => {
  // .env files are read too (only AFTERGLOW_* keys); real environment variables win.
  const fileEnv = loadEnv(mode, process.cwd(), 'AFTERGLOW_');
  const env = readAfterglowEnv(
    { ...fileEnv, ...process.env },
    listExperienceSlugs(resolve(import.meta.dirname, 'src/experiences')),
  );

  return {
    base: env.basePath,
    plugins: [react(), afterglowPlugin(env)],
    build: {
      target: 'es2022',
      assetsInlineLimit: 2048,
      sourcemap: false,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts'],
      css: false,
    },
  };
});
