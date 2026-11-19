/* eslint-disable camelcase -- the data files use snake_case keys. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const { buildCurriculum, filterCurriculum, isLongGroup } =
  await import('../src/lib/master-curriculum.ts');

const row = (overrides) => ({
  code: null,
  course: 'Course',
  credits: 6,
  cycle: 'second',
  group: null,
  group_name: null,
  kind: 'elective',
  program: 'DS23_1',
  semester: 1,
  ...overrides,
});

const ROWS = [
  row({ course: 'Faculty B', group: 'faculty_winter' }),
  row({ course: 'Faculty A', group: 'faculty_winter' }),
  row({ course: 'Program', group: 'program_winter' }),
  row({ course: 'Mandatory 1', kind: 'mandatory' }),
  row({ course: 'Mandatory 2', kind: 'mandatory' }),
  row({ course: 'Summer', group: 'program_summer', semester: 2 }),
  row({ course: 'Thesis', kind: 'mandatory', semester: 2 }),
  row({
    course: 'Named',
    group: 'named',
    group_name: 'Extra list',
    semester: 2,
  }),
  row({
    course: 'Unplaced',
    group: 'named',
    group_name: 'Late',
    semester: null,
  }),
  row({ course: 'Other program', program: 'SI23_1' }),
  row({ course: 'Mandatory 1', kind: 'mandatory' }),
];

test('a program is split into semesters in order, unplaced rows last', () => {
  const semesters = buildCurriculum(ROWS, 'DS23_1');
  assert.deepEqual(
    semesters.map(({ semester }) => semester),
    [1, 2, null],
  );
});

test('rows of other programs stay out and repeated rows count once', () => {
  const [first] = buildCurriculum(ROWS, 'DS23_1');
  assert.deepEqual(
    first.mandatory.map(({ course }) => course),
    ['Mandatory 1', 'Mandatory 2'],
  );
  assert.equal(buildCurriculum(ROWS, 'NONE').length, 0);
});

test('electives group by list in display order with sorted courses', () => {
  const [first, second] = buildCurriculum(ROWS, 'DS23_1');
  assert.deepEqual(
    first.electives.map(({ kind }) => kind),
    ['programWinter', 'facultyWinter'],
  );
  assert.deepEqual(
    first.electives[1].entries.map(({ course }) => course),
    ['Faculty A', 'Faculty B'],
  );
  assert.deepEqual(
    second.electives.map(({ kind, name }) => [kind, name]),
    [
      ['programSummer', null],
      ['named', 'Extra list'],
    ],
  );
});

test('only the faculty-wide lists are long', () => {
  const [first] = buildCurriculum(ROWS, 'DS23_1');
  assert.deepEqual(first.electives.map(isLongGroup), [false, true]);
});

test('elective courses sort by the name shown, in the language given', () => {
  const english = { 'Faculty A': 'Zebra', 'Faculty B': 'Apple' };
  const [first] = buildCurriculum(ROWS, 'DS23_1', {
    locale: 'en',
    nameOf: (entry) => english[entry.course] ?? entry.course,
  });
  assert.deepEqual(
    first.electives[1].entries.map(({ course }) => course),
    ['Faculty B', 'Faculty A'],
  );
});

test('filtering drops courses, then the lists and semesters left empty', () => {
  const semesters = buildCurriculum(ROWS, 'DS23_1');
  const kept = filterCurriculum(semesters, (entry) =>
    ['Faculty A', 'Thesis'].includes(entry.course),
  );
  assert.deepEqual(
    kept.map(({ semester }) => semester),
    [1, 2],
  );
  assert.deepEqual(kept[0].mandatory, []);
  assert.deepEqual(
    kept[0].electives.map(({ entries, kind }) => [kind, entries.length]),
    [['facultyWinter', 1]],
  );
  assert.deepEqual(kept[1].electives, []);
  assert.deepEqual(
    filterCurriculum(semesters, () => false),
    [],
  );
});
