import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';
import {
  ELECTIVE,
  makeCourse,
  passedAll,
} from './support/simulator-fixtures.js';

const {
  evaluatePlan,
  getPlanOptions,
  getPlanStart,
  loadPlan,
  setPlannedSemester,
} = await import('../src/lib/study-plan.ts');
const {
  getSimulatorShareUrl,
  readSimulatorShareState,
  restorePlanFromShareState,
  restoreStatusesFromShareState,
} = await import('../src/lib/simulator-share.ts');

const after = (name) => ({ name, type: 'course' });
const REQUIRED_4YR = 'задолжителен (4 г.)';

const COURSES = [
  makeCourse({ name: 'А', semester: 1 }),
  makeCourse({ name: 'Б', prereqNode: after('А'), semester: 3 }),
  makeCourse({ name: 'В', prereqNode: after('Б'), semester: 3 }),
  makeCourse({
    credits: 30,
    level: 2,
    name: 'Изборна 1',
    semester: 3,
    state: ELECTIVE,
  }),
  makeCourse({
    credits: 12,
    level: 2,
    name: 'Изборна 2',
    semester: 5,
    state: ELECTIVE,
  }),
  makeCourse({
    level: 3,
    name: 'Кредити',
    prereqNode: { amount: 60, type: 'credits' },
    semester: 5,
    state: ELECTIVE,
  }),
  makeCourse({ name: 'Минато', semester: 2 }),
  makeCourse({ name: 'Непланиран', semester: 4 }),
];
const evaluate = (plan, courses = COURSES) =>
  evaluatePlan({
    baseCredits: 6,
    courseInfoMap: new Map(courses.map((course) => [course.name, course])),
    courses,
    plan,
    statuses: passedAll(['А']),
  });

test('the plan starts after the latest taken semester, in the course season', () => {
  assert.equal(getPlanStart(COURSES, passedAll(['А'])), 2);
  assert.deepEqual(getPlanOptions(COURSES[1], 2), [3, 5, 7]);
  assert.deepEqual(getPlanOptions(COURSES[6], 4), [4, 6, 8]);
  const plan = setPlannedSemester({}, 'Б', 3);
  assert.deepEqual(plan, { Б: 3 });
  assert.deepEqual(setPlannedSemester(plan, 'Б', undefined), {});
});

test('plan issues cover prerequisites, credit thresholds, level limits, season and the past', () => {
  const { issues, semesters, unplannedRequired } = evaluate({
    Б: 3,
    В: 3,
    'Изборна 1': 3,
    'Изборна 2': 5,
    Кредити: 5,
    Минато: 1,
  });
  assert.equal(issues['Б'], undefined);
  assert.deepEqual(issues['В'], ['prerequisites']);
  assert.deepEqual(issues['Изборна 2'], ['levelLimit']);
  assert.deepEqual(issues['Кредити'], ['prerequisites']);
  assert.deepEqual(issues['Минато'], ['past', 'season']);
  assert.deepEqual(evaluate({ Б: 4 }).issues['Б'], ['season']);
  assert.deepEqual(
    unplannedRequired.map((course) => course.name),
    ['Непланиран'],
  );
  const third = semesters.find((entry) => entry.semester === 3);
  assert.equal(third.credits, 42);
  // 6 earned, 6 for Минато planned in a past semester, 42 in semester 3.
  assert.equal(third.cumulativeCredits, 54);
  assert.equal(evaluate({ Б: 3, В: 5 }).issues['В'], undefined);
});

test('projected graduation needs the credits and every required course of the degree', () => {
  const courses = [
    makeCourse({ name: 'А', semester: 1 }),
    makeCourse({ credits: 170, name: 'Голем', semester: 6 }),
    makeCourse({
      credits: 60,
      name: 'Четврта',
      semester: 7,
      state: REQUIRED_4YR,
    }),
  ];
  assert.deepEqual(evaluate({ Голем: 6, Четврта: 7 }, courses).graduation, {
    fourYear: 7,
    threeYear: 6,
  });
  assert.deepEqual(evaluate({ Голем: 6 }, courses).graduation, {
    fourYear: undefined,
    threeYear: 6,
  });
});

test('share links carry the plan, and version 1 links still open without one', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const goTo = (href) => {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { href },
      writable: true,
    });
  };
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'location', descriptor);
    else Reflect.deleteProperty(globalThis, 'location');
  });
  goTo('https://courses.example/?page=simulator');
  const statuses = passedAll(['А']);
  const url = getSimulatorShareUrl({
    accreditation: '2023',
    courses: COURSES,
    hpcCompleted: false,
    plan: { Б: 3, Непланиран: 4 },
    program: 'kn',
    seasonFilter: null,
    showOnlyEnabled: false,
    statuses,
    uniListCredits: 0,
  });
  goTo(url);
  const shared = readSimulatorShareState();
  assert.deepEqual(restorePlanFromShareState(COURSES, shared), {
    Б: 3,
    Непланиран: 4,
  });

  const parameter = new URL(url).searchParams.get('sim').split('.');
  const legacy = new URL(url);
  legacy.searchParams.set('sim', ['1', ...parameter.slice(1, 6)].join('.'));
  goTo(legacy.href);
  const legacyState = readSimulatorShareState();
  assert.deepEqual(restorePlanFromShareState(COURSES, legacyState), {});
  assert.deepEqual(
    restoreStatusesFromShareState(COURSES, legacyState),
    statuses,
  );
});

test('a plan past the last semester has no semesters left', () => {
  const courses = [makeCourse({ name: 'Последен', semester: 8 })];
  const evaluation = evaluatePlan({
    baseCredits: 6,
    courseInfoMap: new Map(),
    courses,
    plan: {},
    statuses: passedAll(['Последен']),
  });
  assert.deepEqual(evaluation.semesters, []);
  assert.deepEqual(evaluation.graduation, {
    fourYear: undefined,
    threeYear: undefined,
  });
});

test('a stored plan must be an object of semesters', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  );
  let stored = '[3, 5]';
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => stored },
    writable: true,
  });
  t.after(() => {
    if (descriptor)
      Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
  assert.deepEqual(loadPlan('2023'), {});
  stored = JSON.stringify({ Б: 3, В: 9, Г: 'x' });
  assert.deepEqual(loadPlan('2023'), { Б: 3 });
});
