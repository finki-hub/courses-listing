import { expect, type Page } from '@playwright/test';

import { prepareContext, test } from './fixtures';

const SEARCH = { name: 'Search courses' };
const SAVE_ADVANCED = { name: 'Save Advanced programming' };
const ADVANCED = 'Advanced programming';
const ALGORITHMS = 'Algorithms and data';
const ALL_COURSES = '178 courses';
const REMOVE_ONLY_SAVED = { name: 'Remove filter: Only saved' };
const ONLY_SAVED = /^Only saved \(\d+\)$/u;
const SAVED_KEY = 'finki-hub-saved-courses';
const PRESSED = 'aria-pressed';
const DESKTOP = { height: 900, width: 1_400 };

const search = async (page: Page, text: string) => {
  await page.getByRole('textbox', SEARCH).fill(text);
};

test.describe('saving courses', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
  });

  test('a star in a row saves without opening the panel, and persists', async ({
    page,
  }) => {
    await page.goto('/');
    await search(page, ADVANCED);
    const star = page.getByRole('button', SAVE_ADVANCED);
    await expect(star).toHaveAttribute(PRESSED, 'false');
    await star.click();
    await expect(star).toHaveAttribute(PRESSED, 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.reload();
    await search(page, ADVANCED);
    await expect(page.getByRole('button', SAVE_ADVANCED)).toHaveAttribute(
      PRESSED,
      'true',
    );
  });

  test('the star works from the keyboard', async ({ page }) => {
    await page.goto('/');
    await search(page, ADVANCED);
    const star = page.getByRole('button', SAVE_ADVANCED);
    await star.focus();
    await page.keyboard.press('Enter');
    await expect(star).toHaveAttribute(PRESSED, 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.keyboard.press('Space');
    await expect(star).toHaveAttribute(PRESSED, 'false');
  });

  test('the panel has a star that matches the list', async ({ page }) => {
    await page.goto('/?course=F23L3W140');
    const dialog = page.getByRole('dialog');
    const star = dialog.getByRole('button', SAVE_ADVANCED);
    await expect(star).toHaveAttribute(PRESSED, 'false');
    await star.click();
    await expect(star).toHaveAttribute(PRESSED, 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await search(page, ADVANCED);
    await expect(page.getByRole('button', SAVE_ADVANCED)).toHaveAttribute(
      PRESSED,
      'true',
    );
  });

  test('the Saved filter keeps saved courses, in the URL and after reload', async ({
    page,
  }) => {
    await page.goto('/');
    for (const name of [ADVANCED, ALGORITHMS]) {
      await search(page, name);
      await page
        .getByRole('button', { name: `Save ${name}` })
        .first()
        .click();
    }
    await search(page, '');
    await page.getByRole('checkbox', { name: ONLY_SAVED }).check();
    await expect(page.getByText('2 courses')).toBeVisible();
    await expect(page.getByRole('button', REMOVE_ONLY_SAVED)).toBeVisible();
    expect(page.url()).toContain('savedonly=1');

    await page.reload();
    await expect(page.getByText('2 courses')).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Only saved (2)' }),
    ).toBeChecked();

    // Removing a course's star removes it from the filtered list.
    await page.getByRole('button', SAVE_ADVANCED).click();
    await expect(page.getByText('1 course')).toBeVisible();

    await page.getByRole('button', REMOVE_ONLY_SAVED).click();
    await expect(page.getByText(ALL_COURSES)).toBeVisible();
  });

  test('nothing saved explains how to save', async ({ page }) => {
    await page.goto('/?savedonly=1');
    await expect(
      page
        .getByRole('heading', { name: 'No saved courses yet' })
        .or(page.getByText('No saved courses yet')),
    ).toBeVisible();
    await expect(page.getByText('Use the star next to a course')).toBeVisible();
  });

  test("master's courses can be saved too", async ({ page }) => {
    await page.goto('/?cycle=master');
    await search(page, 'Data Engineering');
    const star = page.getByRole('button', { name: 'Save Data Engineering' });
    await star.click();
    await expect(star).toHaveAttribute(PRESSED, 'true');
    await page.getByRole('checkbox', { name: ONLY_SAVED }).check();
    await search(page, '');
    await expect(page.getByText('1 course')).toBeVisible();
  });
});

test.describe('saving on a phone', () => {
  test('a card has a star beside it that does not open the panel', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 800, width: 390 });
    await page.goto('/');
    await search(page, ADVANCED);
    const star = page.getByRole('button', SAVE_ADVANCED);
    await star.click();
    await expect(star).toHaveAttribute(PRESSED, 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
});

test.describe('sharing saved courses', () => {
  test('a link shows the courses and offers to add them to the own list', async ({
    browser,
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    for (const name of [ADVANCED, ALGORITHMS]) {
      await search(page, name);
      await page
        .getByRole('button', { name: `Save ${name}` })
        .first()
        .click();
    }
    await page.getByRole('button', { name: 'Share saved courses' }).click();
    const link = await page.evaluate(async () =>
      navigator.clipboard.readText(),
    );
    expect(link).toContain('saved=F23L3W140,');

    // Someone else, with a different course saved, opens it.
    const otherContext = await browser.newContext({ viewport: DESKTOP });
    await prepareContext(otherContext, 'en');
    await otherContext.addInitScript((key) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(['Data Engineering']));
      }
    }, SAVED_KEY);
    const other = await otherContext.newPage();
    await other.goto(link);
    await expect(
      other.getByText('Showing 2 courses shared with you.'),
    ).toBeVisible();
    await expect(other.getByText('2 courses', { exact: true })).toBeVisible();
    await expect(
      other.getByRole('checkbox', { name: 'Only saved (1)' }),
    ).toBeChecked();

    await other.getByRole('button', { name: 'Add to my saved' }).click();
    await expect(
      other.getByText('Showing 2 courses shared with you.'),
    ).toHaveCount(0);
    // Their own course stayed; the shared ones joined it.
    await expect(
      other.getByRole('checkbox', { name: 'Only saved (3)' }),
    ).toBeChecked();
    expect(other.url()).not.toContain('saved=F23');
    await otherContext.close();
  });

  test('unknown codes in a link are ignored', async ({ page }) => {
    await page.goto('/?saved=F00NOPE,NOTHING');
    await expect(page.getByText('shared with you')).toHaveCount(0);
    await expect(page.getByText(ALL_COURSES)).toBeVisible();
  });
});
