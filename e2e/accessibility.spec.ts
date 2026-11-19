import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

import { test } from './fixtures';

const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
];

const COURSE_COUNT = /^\d+ courses?$/u;
const LANGUAGE_BUTTON = /^Language/u;
const FILTERS_BUTTON = /^Filters,/u;
const MAP_REGION = /^Prerequisite map/u;
const SETTINGS_BUTTON = /^Change the program/u;
const FACULTY_WINTER = /^Faculty electives, winter/u;
const ADVANCED_PROGRAMMING = /^Advanced programming(?: |$)/u;

// Waits for transitions to finish, so axe sees colours as they settle.
const settle = async (page: Page) => {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState !== 'running'),
  );
};

const startSimulator = async (page: Page) => {
  await page.goto('/?page=simulator');
  await page
    .getByLabel('Study program')
    .selectOption({ label: 'КН: Computer Science' });
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: 'Semester 1' })).toBeVisible();
};

type Scene = {
  readonly name: string;
  readonly setup: (page: Page) => Promise<void>;
};

const SCENES: readonly Scene[] = [
  {
    name: 'course list',
    setup: async (page) => {
      await page.goto('/');
      await expect(page.getByText(COURSE_COUNT)).toBeVisible();
    },
  },
  {
    name: 'course panel',
    setup: async (page) => {
      await page.goto('/?course=F23L3W140');
      await expect(page.getByRole('dialog')).toBeVisible();
    },
  },
  {
    name: "master's course panel",
    setup: async (page) => {
      await page.goto('/?cycle=master&course=Data%20Engineering');
      await expect(
        page.getByRole('dialog').getByRole('heading', { name: 'Mandatory' }),
      ).toBeVisible();
    },
  },
  {
    name: "master's curriculum",
    setup: async (page) => {
      await page.goto('/?cycle=master&prog=DS23_1&layout=curriculum');
      await page.getByRole('button', { name: FACULTY_WINTER }).click();
    },
  },
  {
    name: 'language menu',
    setup: async (page) => {
      await page.goto('/');
      await page.getByRole('button', { name: LANGUAGE_BUTTON }).click();
      await expect(
        page.getByRole('option', { exact: true, name: 'English' }),
      ).toBeVisible();
    },
  },
  {
    name: 'filters sheet',
    setup: async (page) => {
      await page.goto('/');
      await expect(page.getByText(COURSE_COUNT)).toBeVisible();
      const button = page.getByRole('button', { name: FILTERS_BUTTON });
      // Phones only; wider screens show the filters beside the list.
      if (!(await button.isVisible())) {
        return;
      }

      await button.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    },
  },
  {
    name: 'simulator setup',
    setup: async (page) => {
      await page.goto('/?page=simulator');
      await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    },
  },
  { name: 'simulator checklist', setup: startSimulator },
  {
    name: 'simulator settings',
    setup: async (page) => {
      await startSimulator(page);
      await page.getByRole('button', { name: SETTINGS_BUTTON }).click();
    },
  },
  {
    name: 'simulator what next',
    setup: async (page) => {
      await startSimulator(page);
      await page.getByRole('radio', { name: 'What next' }).check();
    },
  },
  {
    name: 'simulator plan',
    setup: async (page) => {
      await startSimulator(page);
      await page.getByRole('radio', { name: 'Plan' }).check();
    },
  },
  {
    name: 'prerequisite picker',
    setup: async (page) => {
      await page.goto('/?page=prerequisites');
      await page
        .getByRole('textbox', { name: 'Choose a course' })
        .fill('алгоритми');
    },
  },
  {
    name: 'prerequisite map',
    setup: async (page) => {
      await page.goto('/?page=prerequisites&focus=F23L2W001');
      await expect(
        page.getByRole('region', { name: MAP_REGION }),
      ).toBeVisible();
    },
  },
  {
    name: 'equivalencies',
    setup: async (page) => {
      await page.goto('/?page=equivalencies');
      await expect(page.getByRole('article').first()).toBeVisible();
    },
  },
];

// Each violation with the elements it was found on, readable in a failure.
const findViolations = async (page: Page): Promise<string[]> => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map((violation) => {
    const targets = violation.nodes.map((node) => node.target.join(' '));
    return `${violation.id}: ${violation.help} (${targets.join(', ')})`;
  });
};

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`axe, ${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const scene of SCENES) {
      test(scene.name, async ({ page }) => {
        await scene.setup(page);
        await settle(page);
        // Sticky bars cover content scrolled under them; scan from the top.
        await page.evaluate(() => {
          scrollTo({ behavior: 'instant', top: 0 });
        });
        expect(await findViolations(page)).toEqual([]);
      });
    }
  });
}

test.describe('keyboard', () => {
  test('closing the course panel returns focus to the course', async ({
    page,
  }) => {
    await page.goto('/?q=advanced%20programming');
    const course = page.getByRole('button', { name: ADVANCED_PROGRAMMING });
    await course.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(course).toBeFocused();
  });

  test('an elective list opens and closes from the keyboard', async ({
    page,
  }) => {
    await page.goto('/?cycle=master&prog=DS23_1&layout=curriculum');
    const toggle = page.getByRole('button', { name: FACULTY_WINTER });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('focus is never hidden under the sticky bars', async ({ page }) => {
    await startSimulator(page);
    const progress = page.getByRole('region', { name: 'Your progress' });
    const radio = page
      .getByRole('radiogroup', { name: 'Status of Calculus 2' })
      .getByRole('radio', { name: 'Not taken' });
    // Scroll far enough for the progress header to stick, then measure it.
    await page.evaluate(() => {
      scrollTo({ behavior: 'instant', top: 800 });
    });
    await radio.focus();
    // Put the focused row right under the sticky bars, so the controls
    // before it are scrolled up beneath them.
    const box = await progress.boundingBox();
    const stickyBottom = (box?.y ?? 0) + (box?.height ?? 0);
    await radio.evaluate((element, bottom) => {
      scrollBy({
        behavior: 'instant',
        top: element.getBoundingClientRect().top - bottom - 4,
      });
    }, stickyBottom);
    for (let step = 0; step < 6; step++) {
      await page.keyboard.press('Shift+Tab');
      const focusedTop = await page.evaluate(
        () => document.activeElement?.getBoundingClientRect().top ?? 0,
      );
      expect(focusedTop).toBeGreaterThanOrEqual(stickyBottom);
    }
  });
});
