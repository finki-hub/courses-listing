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

const { filterCourses } = await import('../src/lib/course-filters.ts');

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

test('course search matches abbreviations in Cyrillic and Latin', () => {
  assert.deepEqual(search('ООП'), ['ООП']);
  assert.deepEqual(search('oop'), ['ООП']);
  assert.deepEqual(search('aps'), ['АПС']);
});

test('course search matches 2018 and 2023 course codes', () => {
  assert.deepEqual(search('F23L1S008'), ['ООП']);
  assert.deepEqual(search('f18l1s008'), ['ООП']);
  assert.deepEqual(search('F23L2W016'), ['АПС']);
});

test('course search matches professors and assistants', () => {
  assert.deepEqual(search('Kostadin'), ['ООП']);
  assert.deepEqual(search('Граматиков'), ['АПС']);
  assert.deepEqual(search('sasanski'), ['ООП']);
});

test('course search keeps matching names and returns nothing for unknown terms', () => {
  assert.deepEqual(search('object-oriented'), ['ООП']);
  assert.deepEqual(search('podatochni'), ['АПС']);
  assert.deepEqual(search('nonexistent'), []);
});
