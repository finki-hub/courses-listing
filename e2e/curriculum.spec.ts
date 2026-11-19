import { expect } from '@playwright/test';

import { test } from './fixtures';

const LAYOUT_PARAM = /[?&]layout=curriculum/u;
const COURSE_PARAM = /course=/u;
const FACULTY_WINTER = /^Faculty electives, winter/u;
const DATA_ENGINEERING = /^Data Engineering/u;
const DATA_SCIENCE = /^Data Science/u;

test.describe("master's curriculum", () => {
  test('lays a program out by semester and opens its courses', async ({
    page,
  }) => {
    await page.goto('/?cycle=master&prog=DS23_1');
    await page.getByRole('radio', { name: 'Curriculum' }).check();
    await expect(page).toHaveURL(LAYOUT_PARAM);

    await expect(
      page.getByRole('heading', {
        name: 'Master of Science in Data science in computer science and engineering',
      }),
    ).toBeVisible();
    await expect(page.getByText('60 ECTS')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Semester 1' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Semester 2' }),
    ).toBeVisible();

    // The long faculty list starts closed and opens on demand.
    const faculty = page.getByRole('button', { name: FACULTY_WINTER }).first();
    await expect(faculty).toHaveAttribute('aria-expanded', 'false');
    await faculty.click();
    await expect(faculty).toHaveAttribute('aria-expanded', 'true');

    // English names show in English, and a course opens its details.
    await page.getByRole('button', { name: DATA_ENGINEERING }).click();
    await expect(page).toHaveURL(COURSE_PARAM);
    await expect(
      page.getByRole('dialog', { name: 'Data Engineering' }),
    ).toBeVisible();
  });

  test('search narrows the curriculum and can be cleared', async ({ page }) => {
    await page.goto('/?cycle=master&prog=DS23_1&layout=curriculum');
    await expect(
      page.getByRole('heading', { name: 'Semester 2' }),
    ).toBeVisible();
    await expect(page.getByLabel('Sort by')).toBeHidden();

    const search = page.getByRole('textbox', { name: 'Search courses' });
    await search.fill('Data Engineering');
    await expect(
      page.getByRole('button', { name: DATA_ENGINEERING }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: DATA_SCIENCE })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole('heading', { name: 'Semester 2' }),
    ).toBeHidden();

    await search.fill('zzzqqq');
    await expect(
      page.getByText('No courses match these filters'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(
      page.getByRole('heading', { name: 'Semester 2' }),
    ).toBeVisible();
  });

  test('asks for a program first and returns to the list', async ({ page }) => {
    await page.goto('/?cycle=master&layout=curriculum');
    await expect(
      page.getByText("Choose a master's program", { exact: true }),
    ).toBeVisible();

    await page.getByRole('radio', { exact: true, name: 'List' }).check();
    await expect(page).not.toHaveURL(LAYOUT_PARAM);
  });

  test('does not scroll sideways on a phone', async ({ page }) => {
    await page.setViewportSize({ height: 800, width: 360 });
    await page.goto('/?cycle=master&prog=SI23_2&layout=curriculum');
    await expect(
      page.getByRole('heading', { name: 'Semester 4' }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
