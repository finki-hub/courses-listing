import { expect } from '@playwright/test';

import { test } from './fixtures';

const COURSE_COUNT = /^\d+ courses?$/u;
const QUERY_PARAM = /[?&]q=advanced/u;
const COURSE_PARAM = /[?&]course=F23L3W140/u;
const ANY_COURSE_PARAM = /course=/u;
const MASTER_PARAM = /[?&]cycle=master/u;
// The table names the button after the course; phone cards add details.
const ADVANCED_PROGRAMMING = /^Advanced programming(?: |$)/u;
const LANGUAGE_BUTTON = /^Language/u;

test.describe('course listing', () => {
  test('search narrows the list and survives a reload', async ({ page }) => {
    await page.goto('/');
    const count = page.getByText(COURSE_COUNT);
    await expect(count).toHaveText('178 courses');

    await page
      .getByRole('textbox', { name: 'Search courses' })
      .fill('advanced programming');
    await expect(count).toHaveText('1 course');
    await expect(page).toHaveURL(QUERY_PARAM);

    await page.reload();
    await expect(
      page.getByRole('textbox', { name: 'Search courses' }),
    ).toHaveValue('advanced programming');
    await expect(
      page.getByRole('button', { name: ADVANCED_PROGRAMMING }),
    ).toBeVisible();
  });

  test('a course opens in a linked dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: ADVANCED_PROGRAMMING }).click();

    const dialog = page.getByRole('dialog', { name: 'Advanced programming' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(COURSE_PARAM);
    await expect(
      dialog.getByRole('heading', { name: 'Prerequisites' }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Object-oriented programming' }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(ANY_COURSE_PARAM);

    await page.goto('/?course=F23L3W140');
    await expect(
      page.getByRole('dialog', { name: 'Advanced programming' }),
    ).toBeVisible();
  });

  test("the master's switch lists master's programs", async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: "Master's" }).check();
    await expect(page).toHaveURL(MASTER_PARAM);

    const count = page.getByText(COURSE_COUNT);
    await expect(count).toHaveText('193 courses');

    // A program narrows the list to its own courses.
    await page.goto('/?cycle=master&prog=DS23_1');
    await expect(count).not.toHaveText('193 courses');
    await expect(page.getByText(COURSE_COUNT)).not.toHaveText('0 courses');
  });

  test('the language switch translates the page', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Courses' }),
    ).toBeVisible();
    await page.getByRole('button', { name: LANGUAGE_BUTTON }).click();
    await page.getByRole('option', { name: 'Македонски' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Предмети' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'mk');
  });
});
