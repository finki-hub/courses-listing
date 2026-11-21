import { type BrowserContext, expect, test } from '@playwright/test';
import { join } from 'node:path';

const DATA_HOST = 'https://data.finki-hub.com/legacy/';
const FIXTURES = join(import.meta.dirname, 'fixtures');

const prepare = async (context: BrowserContext, failing: string) => {
  await context.route(`${DATA_HOST}**`, async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').pop() ?? '';
    if (file === failing) {
      await route.abort('failed');
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      path: join(FIXTURES, file),
    });
  });
  await context.addInitScript(() => {
    localStorage.setItem('finki-hub-lang', 'en');
  });
};

test('a failed course load shows the error instead of hanging', async ({
  context,
  page,
}) => {
  await prepare(context, 'courses.json');
  await page.goto('/?page=simulator');
  await expect(page.getByText('Unable to load courses.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test("a failed master's load shows its error", async ({ context, page }) => {
  await prepare(context, 'degree_programs.json');
  await page.goto('/?page=listing&cycle=master');
  await expect(
    page.getByText("Couldn't load the master's programs."),
  ).toBeVisible();
});
