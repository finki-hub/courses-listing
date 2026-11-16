import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

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

const { filterCourses, getCourseIdentityFields } =
  await import('../src/lib/course-filters.ts');

const makeCourse = (overrides) => ({
  '2018-available': 'FALSE',
  '2023-available': 'TRUE',
  name: 'Course',
  professors: '',
  ...overrides,
});

const COURSES = [
  makeCourse({
    '2018-code': 'F18L1S008',
    '2023-code': 'F23L1S008',
    abbreviation: 'ООП',
    assistants: 'Ана Тодоровска\nДарко Сасански',
    name: 'Објектно-ориентирано програмирање',
    'name-en': 'Object-oriented programming',
    professors: 'Костадин Мишев\nРисте Стојанов',
  }),
  makeCourse({
    '2023-code': 'F23L2W016',
    abbreviation: 'АПС',
    name: 'Алгоритми и податочни структури',
    professors: 'Сашо Граматиков',
  }),
];

const search = (searchTerm) =>
  filterCourses(COURSES, {
    accreditation: null,
    level: null,
    searchTerm,
    season: null,
    tags: new Set(),
  }).map((course) => course.abbreviation);

const CASES = [
  [
    'abbreviations in Cyrillic and Latin',
    { aps: 'АПС', oop: 'ООП', ООП: 'ООП' },
  ],
  [
    '2018 and 2023 course codes',
    { f18l1s008: 'ООП', F23L1S008: 'ООП', F23L2W016: 'АПС' },
  ],
  [
    'professors and assistants',
    { Kostadin: 'ООП', sasanski: 'ООП', Граматиков: 'АПС' },
  ],
  ['names', { 'object-oriented': 'ООП', podatochni: 'АПС' }],
];

for (const [label, expectations] of CASES) {
  test(`course search matches ${label}`, () => {
    for (const [term, abbreviation] of Object.entries(expectations)) {
      assert.deepEqual(search(term), [abbreviation], term);
    }
  });
}

test('course search returns nothing for unknown terms', () => {
  assert.deepEqual(search('nonexistent'), []);
});

test('course identity fields cover names, abbreviation and codes but not staff', () => {
  const fields = getCourseIdentityFields(COURSES[0]);
  for (const value of [
    'Object-oriented programming',
    'ООП',
    'F18L1S008',
    'F23L1S008',
  ]) {
    assert.ok(fields.includes(value), value);
  }
  assert.ok(fields.every((value) => !value.includes('Мишев')));
});
