import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const { formatCompactYear, getLastOfferedYear, getOffering } =
  await import('../src/lib/course-offering.ts');
const { buildRequiredFor } = await import('../src/lib/required-for.ts');

const YEARS = { all: '2026/2027', summer: '2025/2026', winter: '2026/2027' };

test('years are shown compactly', () => {
  assert.equal(formatCompactYear('2022/2023'), '2022/23');
  assert.equal(formatCompactYear('2022'), '2022');
});

test('the last offered year is the newest with students', () => {
  assert.equal(
    getLastOfferedYear({ '2022/2023': '10', '2024/2025': '0' }),
    '2022/2023',
  );
  assert.equal(getLastOfferedYear({ name: 'x' }), undefined);
});

test('an offering is current, last offered or never', () => {
  const winter = { '2023-available': 'TRUE', '2023-semester': '1' };
  assert.deepEqual(getOffering({ ...winter, '2026/2027': '5' }, YEARS), {
    kind: 'current',
  });
  assert.deepEqual(getOffering({ ...winter, '2023/2024': '5' }, YEARS), {
    kind: 'last',
    year: '2023/2024',
  });
  assert.deepEqual(getOffering(winter, YEARS), { kind: 'never' });
  // A summer course is measured against the latest summer year.
  assert.deepEqual(
    getOffering(
      { '2023-available': 'TRUE', '2023-semester': '2', '2025/2026': '5' },
      YEARS,
    ),
    { kind: 'current' },
  );
});

const course = (name, semester, prerequisite) => ({
  '2023-available': 'TRUE',
  '2023-name': name,
  '2023-prerequisite': prerequisite,
  '2023-semester': String(semester),
  name,
  professors: '',
});

test('required-for lists the courses that name a course, in semester order', () => {
  const courses = [
    course('Algebra', 1, ''),
    course('Calculus', 4, 'Algebra'),
    course('Analysis', 2, 'Algebra'),
    course('Topology', 5, 'Analysis'),
  ];
  const required = buildRequiredFor(courses, '2023');
  assert.deepEqual(required.get('Algebra'), ['Analysis', 'Calculus']);
  assert.deepEqual(required.get('Analysis'), ['Topology']);
  assert.equal(required.get('Topology'), undefined);
  assert.equal(buildRequiredFor(courses, '2018').size, 0);
});
