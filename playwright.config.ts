import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const PORT = 4_173;
const isCi = process.env['CI'] === 'true';

export default defineConfig({
  forbidOnly: isCi,
  fullyParallel: true,
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  retries: isCi ? 1 : 0,
  testDir: './e2e',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${String(PORT)} --strictPort`,
    reuseExistingServer: !isCi,
    timeout: 180_000,
    url: `http://localhost:${String(PORT)}`,
  },
});
