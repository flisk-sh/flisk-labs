import { defineConfig } from '@playwright/test';

// Runs against the live site by default; set BASE_URL to test a local or preview build.
// Uses the installed Google Chrome, so no browser download is needed.
export default defineConfig({
  testDir: '.',
  testMatch: '*.e2e.js', // not *.spec.js, which bun test would pick up
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: process.env.BASE_URL || 'https://practice.flisk.si', channel: 'chrome', trace: 'on-first-retry' },
});
