import { expect, type Page } from '@playwright/test';

import { prepareContext, test } from './fixtures';

const ALGORITHMS_ROW = /^Algorithms and data structures/u;
const SIX_CREDITS = /^6 credits/u;
const SETTINGS_BUTTON = /^Change the program/u;
const HPC_INFO = /Tick this if you passed the HPC course/u;
const FILLED = /^Planned \d+ required courses\./u;
const THREE_YEAR = /3-year degree is complete in:/u;
const ENROLL_REQUIRED = /^Enroll required:/u;
const PASS_REQUIRED = /^Pass required:/u;

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
    await expect(algorithms).toContainText(
      'Prerequisite: Structured programming',
    );
    await expect(algorithms.getByRole('radiogroup')).toHaveCount(0);

    await status(page, 'Structured programming')
      .getByRole('radio', { name: 'Passed' })
      .check();
    await expect(algorithms).not.toContainText('Prerequisites not met');
    await expect(
      status(page, 'Algorithms and data structures').getByRole('radio', {
        name: 'Passed',
      }),
    ).toBeEnabled();
    await expect(page.getByRole('meter', { name: SIX_CREDITS })).toBeVisible();
  });

  test('progress is kept after a reload', async ({ page }) => {
    await setUp(page);
    await status(page, 'Calculus 1')
      .getByRole('radio', { name: 'Passed' })
      .check();
    await page.reload();
    await expect(
      status(page, 'Calculus 1').getByRole('radio', { name: 'Passed' }),
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
    await status(page, 'Structured programming')
      .getByRole('radio', { name: 'Passed' })
      .check();
    await page.getByRole('button', { name: 'Share' }).click();
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
        .getByRole('radiogroup', { name: 'Status of Structured programming' })
        .getByRole('radio', { name: 'Passed' }),
    ).toBeChecked();
    await otherContext.close();
  });
  test('expert mode lets any course be taken', async ({ page }) => {
    await setUp(page);
    const algorithms = page
      .getByRole('listitem')
      .filter({ hasText: ALGORITHMS_ROW });
    await expect(algorithms).toContainText('Prerequisites not met');

    await page.getByRole('button', { name: SETTINGS_BUTTON }).click();
    await page.getByRole('checkbox', { name: 'Ignore prerequisites' }).check();
    await page.keyboard.press('Escape');

    const notice = page.getByText('Prerequisites ignored.');
    await expect(notice).toBeVisible();
    await status(page, 'Algorithms and data structures')
      .getByRole('radio', { name: 'Passed' })
      .check();

    // The choice is kept, and turning it off brings the checks back.
    await page.reload();
    await expect(notice).toBeVisible();
    await page.getByRole('button', { name: 'Turn off' }).click();
    await expect(notice).toBeHidden();
    await expect(algorithms).toContainText('Prerequisites not met');
  });

  test('the plan fills in the required courses, with undo', async ({
    page,
  }) => {
    await setUp(page);
    await page.getByRole('radio', { name: 'Plan' }).check();
    const empty = page.getByText(
      'Plan your remaining courses to see when you would graduate.',
    );
    await expect(empty).toBeVisible();

    await page
      .getByRole('button', { name: 'Fill in required courses' })
      .click();
    await expect(page.getByText(FILLED)).toBeVisible();
    await expect(
      page.getByText('Every required course is already taken or planned.'),
    ).toBeVisible();
    await expect(page.getByText(THREE_YEAR)).toBeVisible();

    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(empty).toBeVisible();
  });

  test('Escape closes an info tip before the settings sheet', async ({
    page,
  }) => {
    await page.goto('/?page=simulator');
    await page
      .getByRole('combobox', { name: 'Study program' })
      .selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: SETTINGS_BUTTON }).click();

    const sheet = page.getByRole('dialog', { name: 'Your studies' });
    await expect(sheet).toBeVisible();
    await sheet
      .getByRole('button', { name: 'More information' })
      .first()
      .click();
    const tip = page.getByText(HPC_INFO);
    await expect(tip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('bulk actions explain what they mark', async ({ page }) => {
    await setUp(page);
    await expect(
      page.getByRole('button', { name: ENROLL_REQUIRED }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: PASS_REQUIRED }).first(),
    ).toBeVisible();
  });
});
