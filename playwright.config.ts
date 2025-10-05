import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/integration',
  timeout: 10000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'NODE_ENV=test npm run dev',
    url: 'http://localhost:3000/health',
    reuseExistingServer: true,
    timeout: 15000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
