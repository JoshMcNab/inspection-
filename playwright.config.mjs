import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.UAW_BASE_URL || 'https://app.ultimateautomotiveworks.com';

export default defineConfig({
  testDir: './tests',
  testMatch: /full-system\.spec\.mjs/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'iphone-webkit',
      use: { ...devices['iPhone 13'] }
    },
    {
      name: 'desktop-chromium',
      grep: /@smoke/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    }
  ]
});
