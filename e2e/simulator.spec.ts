import { expect, type Page } from '@playwright/test';

import { prepareContext, test } from './fixtures';

const ALGORITHMS_ROW = /^Алгоритми и податочни структури/u;
const SIX_CREDITS = /^6 credits/u;

const setUp = async (page: Page) => {
  await page.goto('/?page=simulator');
  await page
    .getByLabel('Study program')
    .selectOption({ label: 'КН: Computer Science' });
  await page.getByRole('button', { name: 'Start' }).click();
};

const status = (page: Page, course: string) =>
  page.getByRole('radiogroup', { exact: true, name: `Status of ${course}` });

test.describe('simulator', () => {
  test('passing a course unlocks the courses that need it', async ({
    page,
  }) => {
    await setUp(page);
    const algorithms = page
      .getByRole('listitem')
      .filter({ hasText: ALGORITHMS_ROW });
    await expect(algorithms).toContainText('Prerequisites not met');
    await expect(algorithms.getByRole('radiogroup')).toHaveCount(0);

    await status(page, 'Структурно програмирање')
      .getByRole('radio', { name: 'Passed' })
      .check();
    await expect(algorithms).not.toContainText('Prerequisites not met');
    await expect(
      status(page, 'Алгоритми и податочни структури').getByRole('radio', {
        name: 'Passed',
      }),
    ).toBeEnabled();
    await expect(page.getByRole('meter', { name: SIX_CREDITS })).toBeVisible();
  });

  test('progress is kept after a reload', async ({ page }) => {
    await setUp(page);
    await status(page, 'Калкулус 1')
      .getByRole('radio', { name: 'Passed' })
      .check();
    await page.reload();
    await expect(
      status(page, 'Калкулус 1').getByRole('radio', { name: 'Passed' }),
    ).toBeChecked();
  });

  test('a shared link opens the same progress elsewhere', async ({
    browser,
    page,
  }) => {
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    await setUp(page);
    await status(page, 'Структурно програмирање')
      .getByRole('radio', { name: 'Passed' })
      .check();
    await page
      .getByRole('button', { name: 'Copy a link to the current state' })
      .click();
    const link = await page.evaluate(async () =>
      navigator.clipboard.readText(),
    );
    expect(link).toContain('sim=');

    // A fresh browser with nothing saved takes the link over directly.
    const otherContext = await browser.newContext();
    await prepareContext(otherContext, 'en');
    const other = await otherContext.newPage();
    await other.goto(link);
    await expect(
      other
        .getByRole('radiogroup', { name: 'Status of Структурно програмирање' })
        .getByRole('radio', { name: 'Passed' }),
    ).toBeChecked();
    await otherContext.close();
  });
});
