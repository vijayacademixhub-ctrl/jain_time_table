import { defineConfig } from '@playwright/test';

/** Smoke tests run against the production build (vite preview). */
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  // One browser at a time keeps timings honest on a laptop; raise on a CI runner.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
