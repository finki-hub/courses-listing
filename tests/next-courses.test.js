import assert from 'node:assert/strict';
import { test } from 'node:test';

import './support/register-alias.js';
import {
  ELECTIVE,
  makeCourse,
  passedAll,
} from './support/simulator-fixtures.js';

const { getReferenceYear, getUpcomingSeason, rankNextCourses } =
  await import('../src/lib/next-courses.ts');

const popular = (previous) => ({
  enrollment: { '2025/2026': String(previous), '2026/2027': String(0) },
});

const COURSES = [
  makeCourse({ name: 'Калкулус', semester: 1 }),
  makeCourse({ name: 'Бази на податоци', semester: 3 }),
  makeCourse({
    level: 3,
    name: 'Мала изборна',
    semester: 3,
    state: ELECTIVE,
    ...popular(40),
  }),
  makeCourse({
    level: 3,
    name: 'Голема изборна',
    semester: 3,
    state: ELECTIVE,
    ...popular(400),
  }),
  makeCourse({ level: 2, name: 'Изборна L2', semester: 1, state: ELECTIVE }),
  makeCourse({ name: 'Заклучен', semester: 5 }),
  makeCourse({ name: 'Летен', semester: 2 }),
];
const CONTEXT = {
  enabledMap: { Заклучен: false },
  fullLevels: new Set(),
  level: null,
  season: 'winter',
  statuses: passedAll(['Калкулус']),
};
const ranked = (context) =>
  rankNextCourses(COURSES, { ...CONTEXT, ...context }).items.map(
    (item) => item.course.name,
  );

test('the upcoming season is summer from October to February', () => {
  assert.deepEqual(
    [1, 2, 3, 9, 10, 12].map((month) => getUpcomingSeason(month)),
    ['summer', 'summer', 'winter', 'winter', 'summer', 'summer'],
  );
});

test('next courses rank required first, then electives by semester and popularity', () => {
  assert.deepEqual(ranked({}), [
    'Бази на податоци',
    'Изборна L2',
    'Голема изборна',
    'Мала изборна',
  ]);
  assert.deepEqual(ranked({ fullLevels: new Set([2]) }), [
    'Бази на податоци',
    'Голема изборна',
    'Мала изборна',
  ]);
  assert.deepEqual(ranked({ season: 'summer' }), ['Летен']);
  assert.deepEqual(ranked({ level: 2 }), ['Изборна L2']);
});

test('popularity uses the latest year with data among the candidates', () => {
  const { items, year } = rankNextCourses(COURSES, CONTEXT);
  assert.equal(year, '2025/2026');
  assert.equal(
    items.find((item) => item.course.name === 'Голема изборна').enrollment,
    400,
  );
  assert.equal(getReferenceYear([COURSES[0]]), undefined);
});
