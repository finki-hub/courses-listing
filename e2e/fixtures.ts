import { test as base, type BrowserContext } from '@playwright/test';
import { join } from 'node:path';

const DATA_HOST = 'https://data.finki-hub.com/legacy/';

// Snapshots of the published data, trimmed to three master's programs, so the
// tests never depend on the network or on the data changing.
const FIXTURE_FILES: ReadonlySet<string> = new Set([
  'courses.json',
  'degree_program_courses.json',
  'degree_programs.json',
]);

// Serves the data from the fixtures and starts the app in the given language.
// The language is only set on the first page load, so tests can switch it.
export const prepareContext = async (
  context: BrowserContext,
  language: string,
): Promise<void> => {
  await context.route(`${DATA_HOST}**`, async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').pop();
    await (file !== undefined && FIXTURE_FILES.has(file)
      ? route.fulfill({
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' },
          path: join(import.meta.dirname, 'fixtures', file),
        })
      : route.fulfill({ status: 404 }));
  });
  await context.addInitScript((lang) => {
    if (sessionStorage.getItem('e2e-init')) return;
    sessionStorage.setItem('e2e-init', '1');
    localStorage.setItem('finki-hub-lang', lang);
  }, language);
};

export const test = base.extend<{ language: string }>({
  context: async ({ context, language }, use) => {
    await prepareContext(context, language);
    await use(context);
  },
  language: ['en', { option: true }],
});
