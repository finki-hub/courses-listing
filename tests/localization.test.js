import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { build } from 'vite';

import {
  formatCount,
  formatNumber,
  getTagLabel,
  interpolate,
  isLanguage,
  languageNames,
  translations,
} from '../src/lib/i18n.ts';
import { localizeHtml, updatePageMetadata } from '../src/lib/page-metadata.ts';
import {
  readBrowserStorage,
  writeBrowserStorage,
} from '../src/lib/safe-storage.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier.startsWith('@/')
        ? new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href
        : specifier,
      context,
    );
  },
});
const { describePrereqNode, isPrerequisiteMet, parsePrerequisite } =
  await import('../src/lib/prerequisite.ts');
const {
  computeEnabledMap,
  computeOverLimitInfo,
  computeReasonMap,
  getProgramStateKind,
  INDIVIDUAL_PROJECT_COURSE_NAME,
  TEAM_PROJECT_COURSE_NAME,
  togglePassedStatus,
} = await import('../src/lib/simulator.ts');
const {
  buildEnrollmentMetrics,
  formatEnrollmentDelta,
  formatEnrollmentDeltaPercent,
} = await import('../src/lib/course-enrollment.ts');
const {
  getSimulatorShareUrl,
  readSimulatorShareState,
  restoreStatusesFromShareState,
} = await import('../src/lib/simulator-share.ts');
const { ALL_TAGS } = await import('../src/types/course.ts');

const flatten = (object, prefix = '') =>
  Object.fromEntries(
    Object.entries(object).flatMap(([key, value]) => {
      const path = `${prefix}${key}`;
      return typeof value === 'string'
        ? [[path, value]]
        : Object.entries(flatten(value, `${path}.`));
    }),
  );
const LANGUAGE_STORAGE_KEY = 'finki-hub-lang';

const placeholders = (text) =>
  text
    .matchAll(/\{\w+\}/gu)
    .map(([value]) => value)
    .toArray()
    .sort();

const stubGlobal = (t, key, value) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value,
    writable: true,
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  });
};

test('dictionaries have complete key, placeholder, tag and status-symbol coverage', () => {
  const english = flatten(translations.en);
  for (const [language, dictionary] of Object.entries(translations)) {
    const values = flatten(dictionary);
    assert.deepEqual(
      Object.keys(values).sort(),
      Object.keys(english).sort(),
      language,
    );
    for (const [key, value] of Object.entries(values)) {
      assert.ok(value.trim(), `${language}.${key}`);
      assert.deepEqual(
        placeholders(value),
        placeholders(english[key]),
        `${language}.${key}`,
      );
    }
    for (const tag of ALL_TAGS)
      assert.ok(Object.hasOwn(dictionary.tagLabels, tag));
    assert.equal(getTagLabel('new-tag', dictionary), 'new-tag');
    assert.equal(getTagLabel('constructor', dictionary), 'constructor');
    assert.ok(dictionary.prereqDescription.met.includes('✅'));
    assert.ok(dictionary.prereqDescription.unmet.includes('❌'));
  }
});

test('accepts exactly the reference languages and rejects inherited dictionary keys', () => {
  assert.deepEqual(Object.keys(languageNames), ['en', 'mk', 'sq', 'tr']);
  for (const language of Object.keys(languageNames))
    assert.ok(isLanguage(language));
  for (const value of [
    null,
    undefined,
    '',
    'de',
    'EN',
    'sq-AL',
    'constructor',
    '__proto__',
  ]) {
    assert.equal(isLanguage(value), false);
  }
});

test('formats counts, sentence placeholders, numbers and percentages for each locale', () => {
  for (const [language, dictionary] of Object.entries(translations)) {
    for (const count of [0, 1, 2, 21, 1_000]) {
      const text = formatCount(dictionary.prerequisites.dependentCount, {
        count,
        language,
        values: { course: 'Оригинален предмет' },
      });
      assert.ok(text.includes(formatNumber(count, language)));
      assert.ok(text.includes('Оригинален предмет'));
      assert.ok(!text.includes('{'));
    }
  }
  assert.equal(
    formatCount(translations.en.listing.resultCount, {
      count: 1,
      language: 'en',
    }),
    '1 course',
  );
  assert.equal(
    formatCount(translations.en.listing.resultCount, {
      count: 0,
      language: 'en',
    }),
    '0 courses',
  );
  assert.equal(
    formatCount(translations.mk.listing.resultCount, {
      count: 21,
      language: 'mk',
    }),
    '21 предмет',
  );
  assert.equal(formatNumber(1_234.5, 'en'), '1,234.5');
  assert.equal(formatNumber(1_234.5, 'tr'), '1.234,5');
  assert.equal(formatEnrollmentDelta(1_234, 'tr'), '+1.234');
  assert.equal(formatEnrollmentDeltaPercent(0.125, 'en'), '+13%');
  assert.equal(formatEnrollmentDeltaPercent(0.125, 'tr'), '+%13');
  assert.equal(formatEnrollmentDeltaPercent(null, 'en'), '—');
  assert.equal(
    interpolate('{value} {unprovided}', { value: 0 }),
    '0 {unprovided}',
  );
});

test('language storage helpers tolerate read and write failures', (t) => {
  const values = new Map();
  stubGlobal(t, 'localStorage', {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  });
  assert.equal(readBrowserStorage(LANGUAGE_STORAGE_KEY), null);
  assert.equal(writeBrowserStorage(LANGUAGE_STORAGE_KEY, 'sq'), true);
  assert.equal(readBrowserStorage(LANGUAGE_STORAGE_KEY), 'sq');
  stubGlobal(t, 'localStorage', {
    getItem: () => {
      throw new Error('Blocked');
    },
    setItem: () => {
      throw new Error('Blocked');
    },
  });
  assert.equal(readBrowserStorage(LANGUAGE_STORAGE_KEY), null);
  assert.equal(writeBrowserStorage(LANGUAGE_STORAGE_KEY, 'en'), false);
});

test('default HTML and runtime metadata use the dictionaries without changing canonical URLs', async () => {
  const source = await readFile('index.html', 'utf8');
  const html = localizeHtml(source);
  assert.ok(html.includes('<html lang="mk">'));
  assert.ok(html.includes(`<title>${translations.mk.appTitle}</title>`));
  assert.ok(!html.includes('__LOCALIZED_'));
  assert.ok(
    html.includes('rel="canonical" href="https://courses.finki-hub.com"'),
  );
  for (const [language, dictionary] of Object.entries(translations)) {
    const tags = new Map();
    const page = {
      documentElement: { lang: '' },
      head: {
        querySelector: (selector) => ({
          setAttribute: (_key, value) => tags.set(selector, value),
        }),
      },
      title: '',
    };
    updatePageMetadata(language, page);
    assert.equal(page.documentElement.lang, language);
    assert.equal(page.title, dictionary.appTitle);
    assert.equal(
      tags.get('meta[name="description"]'),
      dictionary.metadataDescription,
    );
    assert.equal(tags.get('meta[property="og:title"]'), page.title);
    assert.equal(tags.get('meta[name="twitter:title"]'), page.title);
    assert.equal(
      tags.get('meta[property="og:locale"]'),
      { en: 'en_GB', mk: 'mk_MK', sq: 'sq_AL', tr: 'tr_TR' }[language],
    );
    assert.ok(!tags.has('link[rel="canonical"]'));
  }
});

test('production HTML renders Macedonian metadata with no unresolved placeholders', async () => {
  const result = await build({
    build: { write: false },
    envDir: false,
    logLevel: 'silent',
  });
  const output = Array.isArray(result)
    ? result.flatMap((bundle) => bundle.output)
    : result.output;
  const asset = output.find(
    (item) => item.type === 'asset' && item.fileName === 'index.html',
  );
  assert.ok(asset);
  const html =
    typeof asset.source === 'string'
      ? asset.source
      : new TextDecoder().decode(asset.source);
  assert.ok(html.includes(`<title>${translations.mk.appTitle}</title>`));
  assert.ok(html.includes('content="mk_MK"'));
  assert.ok(!html.includes('__LOCALIZED_'));
});

const createCourse = (name) => ({
  credits: 6,
  level: 1,
  name,
  prereqNode: { type: 'none' },
  prerequisite: undefined,
  programState: 'изборен',
  raw: { name, professors: 'Професор' },
  rawPrereqNode: { type: 'none' },
  semester: 3,
});

test('source prerequisite grammar and evaluation stay intact while descriptions translate', () => {
  const name = 'Оригинален предмет';
  const node = parsePrerequisite(`${name} и Втор предмет`, [
    name,
    'Втор предмет',
  ]);
  assert.equal(node.type, 'and');
  const context = {
    courseInfoMap: new Map([[name, { credits: 6, name, semester: 1 }]]),
    courseSemester: 3,
    statuses: {
      [name]: { listened: true, passed: true },
      'Втор предмет': { listened: true, passed: true },
    },
    totalCredits: 12,
  };
  assert.ok(isPrerequisiteMet(node, context));
  assert.equal(
    isPrerequisiteMet(node, {
      ...context,
      statuses: { [name]: context.statuses[name] },
    }),
    false,
  );
  const credits = parsePrerequisite('12 кредити', [name]);
  assert.equal(credits.type, 'credits');
  assert.equal(
    isPrerequisiteMet(credits, { ...context, totalCredits: 6 }),
    false,
  );
  assert.ok(isPrerequisiteMet(credits, context));
  const either = parsePrerequisite(`${name} или Втор предмет`, [
    name,
    'Втор предмет',
  ]);
  for (const dictionary of Object.values(translations)) {
    const lines = describePrereqNode(node, context, {
      electives: new Set(),
      t: dictionary,
    });
    assert.equal(lines.length, 2);
    assert.ok(lines.every((line) => line.includes('✅')));
    assert.ok(lines[0].includes(name));
    assert.ok(lines[0].includes(dictionary.prereqDescription.passed));
    assert.equal(
      describePrereqNode(either, context, {
        electives: new Set(),
        t: dictionary,
      }).length,
      1,
    );
    assert.ok(
      describePrereqNode({ name, type: 'course' }, context, {
        electives: new Set([name]),
        t: dictionary,
      })[0].includes('➖'),
    );
  }
});

test('simulator reason text translates without changing exclusivity or credit limits', () => {
  const team = createCourse(TEAM_PROJECT_COURSE_NAME);
  const individual = createCourse(INDIVIDUAL_PROJECT_COURSE_NAME);
  const statuses = { [team.name]: { listened: true, passed: true } };
  const courseInfoMap = new Map();
  const courses = [team, individual];
  const enabledMap = computeEnabledMap({
    courseInfoMap,
    courses,
    statuses,
    totalCredits: 6,
  });
  assert.equal(enabledMap[individual.name], false);
  const switched = togglePassedStatus(statuses, individual.name);
  assert.equal(switched[team.name].passed, false);
  assert.equal(switched[individual.name].passed, true);
  assert.equal(getProgramStateKind('задолжителен (сем. 7)'), 'required-4yr');
  const overLimit = computeOverLimitInfo(courses, {
    [individual.name]: { listened: true, passed: true },
    [team.name]: { listened: true, passed: true },
  });
  assert.equal(overLimit.excessCredits, 6);
  for (const dictionary of Object.values(translations)) {
    const reasons = computeReasonMap(
      {
        courseInfoMap,
        courses,
        electiveCourses: new Set(),
        enabledMap,
        fullLevels: new Set(),
        overLimitSet: new Set(),
        statuses,
        totalCredits: 6,
      },
      dictionary,
    );
    assert.ok(reasons[team.name].includes(dictionary.reasons.passed));
    assert.ok(reasons[individual.name].includes(team.name));
    assert.ok(
      reasons[individual.name].includes(
        interpolate(dictionary.reasons.exclusiveBlocked, { course: team.name }),
      ),
    );
  }
});

test('enrollment trends translate while computed values and academic years remain unchanged', () => {
  const course = {
    '2024/2025': '1000',
    '2025/2026': '1200',
    name: 'Предмет',
    professors: 'Професор',
  };
  const original = structuredClone(course);
  for (const dictionary of Object.values(translations)) {
    const metrics = buildEnrollmentMetrics(course, dictionary);
    assert.equal(metrics.trend.direction, 'up');
    assert.equal(metrics.trend.delta, 200);
    assert.equal(metrics.trend.label, dictionary.enrollment.increasing);
    assert.equal(metrics.latestEntry.year, '2025/2026');
    assert.deepEqual(course, original);
  }
});

test('share URLs preserve source-course positions and statuses in both accreditations', (t) => {
  stubGlobal(t, 'location', {
    href: 'https://courses.example/?page=simulator',
  });
  const courses = [createCourse('Предмет Б'), createCourse('Предмет А')];
  const statuses = {
    'Предмет А': { listened: true, passed: false },
    'Предмет Б': { listened: true, passed: true },
  };
  for (const accreditation of ['2018', '2023']) {
    const config = {
      accreditation,
      courses,
      hpcCompleted: true,
      program: 'kn',
      seasonFilter: 'winter',
      showOnlyEnabled: true,
      statuses,
      uniListCredits: 18,
    };
    const expected = getSimulatorShareUrl(config);
    for (const dictionary of Object.values(translations)) {
      computeReasonMap(
        {
          courseInfoMap: new Map(),
          courses,
          electiveCourses: new Set(),
          enabledMap: {},
          fullLevels: new Set(),
          overLimitSet: new Set(),
          statuses,
          totalCredits: 12,
        },
        dictionary,
      );
      assert.equal(getSimulatorShareUrl(config), expected);
      Object.assign(location, { href: expected });
      const shared = readSimulatorShareState();
      assert.equal(shared.accreditation, accreditation);
      assert.deepEqual(
        restoreStatusesFromShareState(courses, shared),
        statuses,
      );
    }
  }
});
