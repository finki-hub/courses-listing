import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';
import {
  ELECTIVE,
  makeCourse,
  passedAll,
} from './support/simulator-fixtures.js';

const { computeEnabledMap, computeReasonMap } =
  await import('../src/lib/simulator.ts');
const { evaluatePlan, fillRequiredCourses } =
  await import('../src/lib/study-plan.ts');
const { getSimulatorShareUrl, readSimulatorShareState } =
  await import('../src/lib/simulator-share.ts');
const { en } = await import('../src/lib/locales/en.ts');

const after = (name) => ({ name, type: 'course' });

const COURSES = [
  makeCourse({ name: 'А', semester: 1 }),
  makeCourse({ name: 'Б', prereqNode: after('А'), semester: 3 }),
  makeCourse({ name: 'В', prereqNode: after('Б'), semester: 3 }),
  makeCourse({ name: 'Г', semester: 2 }),
  makeCourse({ name: 'Д', semester: 4 }),
  makeCourse({ name: 'Изборна', semester: 3, state: ELECTIVE }),
];
const courseInfoMap = new Map(COURSES.map((course) => [course.name, course]));

test('expert mode enables any course, whatever it requires', () => {
  const enabled = (ignorePrerequisites) =>
    computeEnabledMap({
      courseInfoMap,
      courses: COURSES,
      ignorePrerequisites,
      statuses: {},
      totalCredits: 0,
    });
  assert.equal(enabled(false)['Б'], false);
  assert.equal(enabled(false)['В'], false);
  assert.equal(enabled(true)['Б'], true);
  assert.equal(enabled(true)['В'], true);

  const reasons = computeReasonMap(
    {
      courseInfoMap,
      courses: COURSES,
      electiveCourses: new Set(),
      enabledMap: enabled(true),
      fullLevels: new Set(),
      ignorePrerequisites: true,
      overLimitSet: new Set(),
      statuses: {},
      totalCredits: 0,
    },
    en,
  );
  // The prerequisite is still described, under a note that it is ignored.
  assert.ok(reasons['Б'].includes(en.reasons.prerequisitesIgnored));
  assert.ok(reasons['Б'].includes(en.reasons.prerequisite));
  assert.ok(!reasons['А'].includes(en.reasons.prerequisitesIgnored));
});

test('a plan in expert mode reports no missing prerequisites', () => {
  const context = {
    baseCredits: 0,
    courseInfoMap,
    courses: COURSES,
    plan: { В: 3 },
    statuses: {},
  };
  assert.deepEqual(evaluatePlan(context).issues['В'], ['prerequisites']);
  assert.equal(
    evaluatePlan({ ...context, ignorePrerequisites: true }).issues['В'],
    undefined,
  );
});

test('filling the plan places required courses after what they require', () => {
  const context = {
    baseCredits: 6,
    courseInfoMap,
    courses: COURSES,
    plan: { Д: 6 },
    statuses: passedAll(['А']),
  };
  const plan = fillRequiredCourses(context);
  // Б in its own semester; В needs Б first, so it moves a year later; Г is
  // past its semester, so it goes to the first of its season; the student's
  // own choice for Д stays, and the elective is left alone.
  assert.deepEqual(plan, { Б: 3, В: 5, Г: 2, Д: 6 });
  assert.deepEqual(evaluatePlan({ ...context, plan }).issues, {});
  assert.deepEqual(fillRequiredCourses({ ...context, plan }), plan);

  // Ignoring prerequisites, everything stays in its recommended semester.
  assert.deepEqual(
    fillRequiredCourses({ ...context, ignorePrerequisites: true }),
    { Б: 3, В: 3, Г: 2, Д: 6 },
  );
});

test('share links carry expert mode; older links open without it', (t) => {
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
  const share = (ignorePrerequisites) => {
    goTo('https://courses.example/?page=simulator');
    return getSimulatorShareUrl({
      accreditation: '2023',
      courses: COURSES,
      hpcCompleted: true,
      ignorePrerequisites,
      plan: {},
      program: 'kn',
      seasonFilter: 'winter',
      showOnlyEnabled: true,
      statuses: passedAll(['Б']),
      uniListCredits: 0,
    });
  };
  for (const ignorePrerequisites of [true, false]) {
    goTo(share(ignorePrerequisites));
    const state = readSimulatorShareState();
    assert.equal(state.ignorePrerequisites, ignorePrerequisites);
    assert.equal(state.hpcCompleted, true);
    assert.equal(state.showOnlyEnabled, true);
    assert.equal(state.seasonFilter, 'winter');
  }
});
