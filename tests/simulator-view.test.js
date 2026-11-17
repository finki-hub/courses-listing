import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';
import { ELECTIVE, makeCourse } from './support/simulator-fixtures.js';

const {
  filterSimulatorCourses,
  getBulkTargets,
  groupBySemester,
  markCourses,
  summarizeSemester,
} = await import('../src/lib/simulator-view.ts');

const OS = 'Оперативни системи';
const COURSES = [
  makeCourse({ name: 'Структурно програмирање', tags: 'coding' }),
  makeCourse({ name: 'Бизнис и менаџмент', state: ELECTIVE }),
  makeCourse({ name: 'Тимски проект', semester: 2 }),
  makeCourse({ name: OS, semester: 2 }),
  makeCourse({
    level: 3,
    name: 'Веб програмирање',
    semester: 5,
    state: ELECTIVE,
    tags: 'web',
  }),
];
const CRITERIA = {
  enabledMap: {},
  level: null,
  search: '',
  season: null,
  showOnlyEnabled: false,
  tags: new Set(),
  type: 'all',
};
const names = (courses) => courses.map((course) => course.name);
const filtered = (criteria) =>
  names(filterSimulatorCourses(COURSES, { ...CRITERIA, ...criteria }));

test('simulator filters combine search, type, tags, level and season', () => {
  assert.deepEqual(filtered({ search: 'operativni' }), [OS]);
  assert.deepEqual(filtered({ type: 'elective' }), [
    'Бизнис и менаџмент',
    'Веб програмирање',
  ]);
  assert.equal(filtered({ type: 'required' }).length, 3);
  assert.deepEqual(filtered({ tags: new Set(['coding', 'web']) }), [
    'Структурно програмирање',
    'Веб програмирање',
  ]);
  assert.deepEqual(filtered({ level: 3 }), ['Веб програмирање']);
  assert.deepEqual(filtered({ season: 'summer' }), ['Тимски проект', OS]);
  assert.deepEqual(
    filtered({
      enabledMap: { 'Веб програмирање': false },
      showOnlyEnabled: true,
      type: 'elective',
    }),
    ['Бизнис и менаџмент'],
  );
});

test('courses group by semester with credit subtotals', () => {
  const groups = groupBySemester(COURSES);
  assert.deepEqual(
    groups.map((group) => group.semester),
    [1, 2, 5],
  );
  const statuses = {
    [OS]: { listened: true, passed: false },
    'Тимски проект': { listened: true, passed: true },
  };
  assert.deepEqual(summarizeSemester(groups[1].courses, statuses), {
    listenedCredits: 12,
    passedCredits: 6,
  });
});

test('bulk actions mark only available required courses outside the project pair', () => {
  const semesterTwo = groupBySemester(COURSES)[1].courses;
  const context = { enabledMap: {}, statuses: {} };
  assert.deepEqual(getBulkTargets(COURSES, context, 'passed'), [
    'Структурно програмирање',
    OS,
  ]);
  assert.deepEqual(
    getBulkTargets(
      semesterTwo,
      { ...context, enabledMap: { [OS]: false } },
      'listened',
    ),
    [],
  );
  const listened = markCourses({}, [OS], 'listened');
  assert.deepEqual(listened[OS], {
    listened: true,
    passed: false,
  });
  assert.deepEqual(
    getBulkTargets(semesterTwo, { ...context, statuses: listened }, 'listened'),
    [],
  );
  assert.deepEqual(markCourses(listened, [OS], 'passed')[OS], {
    listened: true,
    passed: true,
  });
});
