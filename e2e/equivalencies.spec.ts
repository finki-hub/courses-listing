import { expect } from '@playwright/test';

import { test } from './fixtures';

const RESULT_COUNT = /^\d+ results$/u;
const ALGORITHMS_PARAM = /[?&]course=F2\dL2W001/u;

test.describe('equivalencies', () => {
  test('the views and search narrow the cards', async ({ page }) => {
    await page.goto('/?page=equivalencies');
    const region = page.getByRole('region', { name: 'Course equivalencies' });
    const count = region.getByText(RESULT_COUNT);
    const cards = region.getByRole('article');

    await region.getByRole('radio', { name: 'Renamed' }).check();
    await expect(count).toHaveText('18 results');
    await expect(cards).toHaveCount(18);

    await region
      .getByRole('textbox', { name: 'Search course or code' })
      .fill('F23L3W065');
    await expect(cards).toHaveCount(1);
    await expect(
      cards.getByRole('button', { name: 'Сајбер безбедност' }),
    ).toBeVisible();
    await expect(
      cards.getByRole('button', { name: 'Мрежна безбедност' }),
    ).toBeVisible();
  });

  test('a course on a card opens its dialog', async ({ page }) => {
    await page.goto('/?page=equivalencies');
    await page
      .getByRole('button', {
        exact: true,
        name: 'Алгоритми и податочни структури',
      })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(ALGORITHMS_PARAM);
  });
});
