import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';
import { ELECTIVE, makeCourse } from './support/simulator-fixtures.js';

const { getSimulatorProgress, needsSimulatorSetup, STORAGE_KEY_SETUP } =
  await import('../src/lib/simulator-setup.ts');
const { getCourseStatusValue, setCourseStatus } =
  await import('../src/lib/simulator-view.ts');
const { getElectiveCreditsPerLevel } = await import('../src/lib/simulator.ts');

const storage = (entries) => (key) => entries[key] ?? null;

test('setup is asked for only on a first visit without a shared link', () => {
  assert.equal(
    needsSimulatorSetup({ hasShareLink: false, read: storage({}) }),
    true,
  );
  assert.equal(
    needsSimulatorSetup({ hasShareLink: true, read: storage({}) }),
    false,
  );
  for (const key of [
    STORAGE_KEY_SETUP,
    'enrollment-program',
    'enrollment-2023',
  ]) {
    assert.equal(
      needsSimulatorSetup({
        hasShareLink: false,
        read: storage({ [key]: '1' }),
      }),
      false,
      key,
    );
  }
});

test('progress places credits and the 3-year total on the 4-year bar', () => {
  const progress = getSimulatorProgress(117, { 1: 6, 2: 12 });
  assert.equal(progress.credits, 117);
  assert.equal(progress.percent, 50);
  assert.equal(Math.round(progress.threeYearMark), 74);
  assert.deepEqual(progress.levels, [
    { credits: 6, level: 1, limit: 6 },
    { credits: 12, level: 2, limit: 36 },
  ]);
  assert.equal(getSimulatorProgress(400, {}).percent, 100);
  assert.equal(getSimulatorProgress(0, {}).levels[1].credits, 0);
});

test('elective credits per level count passed electives only', () => {
  const courses = [
    makeCourse({ level: 2, name: 'A', state: ELECTIVE }),
    makeCourse({ level: 2, name: 'B', state: ELECTIVE }),
    makeCourse({ level: 2, name: 'C' }),
  ];
  const statuses = {
    A: { listened: true, passed: true },
    B: { listened: true, passed: false },
    C: { listened: true, passed: true },
  };
  assert.deepEqual(getElectiveCreditsPerLevel(courses, statuses), { 2: 6 });
});

test('a course moves between not taken, enrolled and passed', () => {
  const steps = [
    ['passed', { listened: true, passed: true }],
    ['listened', { listened: true, passed: false }],
    ['none', { listened: false, passed: false }],
    ['listened', { listened: true, passed: false }],
  ];
  let statuses = {};
  for (const [target, expected] of steps) {
    statuses = setCourseStatus(statuses, 'X', target);
    assert.deepEqual(statuses.X, expected, target);
    assert.equal(getCourseStatusValue(statuses.X), target);
  }
  assert.equal(setCourseStatus(statuses, 'X', 'listened'), statuses);
  assert.equal(getCourseStatusValue(), 'none');
});

test('choosing one project clears the other', () => {
  const team = 'Тимски проект';
  const individual = 'Самостоен проект';
  const statuses = setCourseStatus(
    { [team]: { listened: true, passed: true } },
    individual,
    'listened',
  );
  assert.equal(getCourseStatusValue(statuses[individual]), 'listened');
  assert.equal(getCourseStatusValue(statuses[team]), 'none');
});
