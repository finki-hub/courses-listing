import { expect } from '@playwright/test';

import { test } from './fixtures';

const AGENT_NAME = 'Agent-based systems';
const AGENT_CARD = /^Agent-based systems/u;
const DATABASES = /^Databases/u;
const SHOW_ALL = /^Show all \d+$/u;
const COURSE_COUNT = /^\d+ courses?$/u;
const STUDENTS_HEADER = /^Students \d{4}\/\d{2}/u;

test.describe('required for', () => {
  test('a course lists the courses that need it and opens them', async ({
    page,
  }) => {
    await page.goto('/?course=F23L2W001');
    const dialog = page.getByRole('dialog');
    const section = dialog.locator('section').filter({
      has: page.getByRole('heading', { name: 'Required for' }),
    });
    await expect(section).toBeVisible();

    // A long list folds away after the first few.
    const toggle = section.getByRole('button', { name: SHOW_ALL }).first();
    const folded = await section.getByRole('listitem').count();
    await toggle.click();
    expect(await section.getByRole('listitem').count()).toBeGreaterThan(folded);
    await expect(
      section.getByRole('button', { name: 'Show fewer' }).first(),
    ).toBeVisible();

    await section.getByRole('button', { name: DATABASES }).first().click();
    await expect(
      dialog.getByRole('heading', { name: DATABASES }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', {
        name: 'Back to Algorithms and data structures',
      }),
    ).toBeVisible();
  });

  test('a course nothing needs has no such section', async ({ page }) => {
    await page.goto('/?course=F23L3S073');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Required for' }),
    ).toHaveCount(0);
  });
});

test.describe('last offered', () => {
  test('the list says when a course without students last ran', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1_400 });
    await page.goto('/');
    await expect(page.getByText(COURSE_COUNT)).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: STUDENTS_HEADER }),
    ).toBeVisible();

    await page
      .getByRole('textbox', { name: 'Search courses' })
      .fill(AGENT_NAME);
    const row = page.getByRole('row').filter({ hasText: AGENT_NAME });
    await expect(row).toContainText('Last: 2025/26');
    await expect(row).toContainText(
      'No students this year. Last offered in 2025/2026',
    );

    await page
      .getByRole('textbox', { name: 'Search courses' })
      .fill('Web3 applications');
    await expect(
      page.getByRole('row').filter({ hasText: 'Web3 applications' }),
    ).toContainText('Never activated');
  });

  test('the panel states when the course was last offered', async ({
    page,
  }) => {
    await page.goto('/?course=F23L3S073');
    await expect(
      page.getByRole('dialog').getByText('Last offered in 2025/2026'),
    ).toBeVisible();
  });

  test('phone cards show it too', async ({ page }) => {
    await page.setViewportSize({ height: 800, width: 390 });
    await page.goto('/');
    await page
      .getByRole('textbox', { name: 'Search courses' })
      .fill(AGENT_NAME);
    await expect(page.getByRole('button', { name: AGENT_CARD })).toContainText(
      'Last: 2025/26',
    );
  });
});
