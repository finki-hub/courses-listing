import { expect } from '@playwright/test';

import { test } from './fixtures';

const STRUCTURED_PROGRAMMING = /^Структурно програмирање/u;
const DATABASES = /^Бази на податоци/u;

test.describe('prerequisite map', () => {
  test('a chosen course shows what it needs and unlocks', async ({ page }) => {
    await page.goto('/?page=prerequisites');
    await page
      .getByRole('textbox', { name: 'Choose a course' })
      .fill('алгоритми');
    await page
      .getByRole('button', {
        exact: true,
        name: 'Алгоритми и податочни структури',
      })
      .click();

    const map = page.getByRole('region', {
      name: 'Prerequisite map for Алгоритми и податочни структури',
    });
    await expect(map).toBeVisible();
    const requires = map.getByRole('region', { name: 'Requires' });
    await expect(
      requires.getByRole('button', { name: STRUCTURED_PROGRAMMING }),
    ).toBeVisible();
    await expect(
      map
        .getByRole('region', { name: 'Unlocks' })
        .getByRole('button', { name: DATABASES }),
    ).toBeVisible();

    // Moving along the map recentres it on the chosen course.
    await requires
      .getByRole('button', { name: STRUCTURED_PROGRAMMING })
      .click();
    await expect(
      page.getByRole('region', {
        name: 'Prerequisite map for Структурно програмирање',
      }),
    ).toBeVisible();
  });

  test('the course dialog leads to the map', async ({ page }) => {
    await page.goto('/?course=F23L3W140');
    await page.getByRole('button', { name: 'Show prerequisite map' }).click();
    await expect(
      page.getByRole('region', {
        name: 'Prerequisite map for Напредно програмирање',
      }),
    ).toBeVisible();
  });
});
