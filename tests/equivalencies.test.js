import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const {
  buildCodeIndex,
  buildEquivalencyPairs,
  mergeCombinationRules,
  pairMatchesView,
  ruleMatchesSearch,
} = await import('../src/lib/equivalencies.ts');

const flatten = (accreditation, info) =>
  info
    ? {
        [`${accreditation}-available`]: 'TRUE',
        [`${accreditation}-code`]: info.code,
        [`${accreditation}-name`]: info.name,
      }
    : {};

const course = (name, info2018, info2023) => ({
  ...flatten('2018', info2018),
  ...flatten('2023', info2023),
  name,
});

const COURSES = [
  course('Бази', { code: 'F18B' }, { code: 'F23B' }),
  course(
    'Алгоритми',
    { code: 'F18A', name: 'Алгоритми' },
    {
      code: 'F23A',
      name: 'Алгоритми и податочни структури',
    },
  ),
  course('Стар', { code: 'F18S' }),
];

test('pairs keep courses in both accreditations, renamed ones first', () => {
  const pairs = buildEquivalencyPairs(COURSES);
  assert.deepEqual(
    pairs.map((pair) => [pair.accreditation2023.code, pair.renamed]),
    [
      ['F23A', true],
      ['F23B', false],
    ],
  );
  assert.ok(pairs[0].searchText.includes('f18a'));
});

test('views split renamed and unchanged pairs and leave rules out', () => {
  const [renamed, unchanged] = buildEquivalencyPairs(COURSES);
  assert.equal(pairMatchesView(renamed, null), true);
  assert.equal(pairMatchesView(renamed, 'renamed'), true);
  assert.equal(pairMatchesView(unchanged, 'renamed'), false);
  assert.equal(pairMatchesView(unchanged, 'unchanged'), true);
  assert.equal(pairMatchesView(unchanged, 'rules'), false);
});

test('combination rules with the same sources merge their targets', () => {
  const a = { code: 'A', name: 'A' };
  const b = { code: 'B', name: 'B' };
  const rule = (target) => ({
    accreditation: '2023',
    kind: 'combination',
    sources: [a, b],
    targets: [target],
  });
  const merged = mergeCombinationRules([
    rule({ code: 'X', name: 'X' }),
    rule({ code: 'Y', name: 'Y' }),
  ]);
  assert.equal(merged.length, 1);
  assert.deepEqual(
    merged[0].targets.map((target) => target.code),
    ['X', 'Y'],
  );
  assert.equal(ruleMatchesSearch(merged[0], 'y'), true);
  assert.equal(ruleMatchesSearch(merged[0], 'z'), false);
});

test('the code index finds a course by accreditation and code', () => {
  const index = buildCodeIndex(COURSES);
  assert.equal(index.get('2018:F18S')?.name, 'Стар');
  assert.equal(index.get('2023:F18S'), undefined);
});
