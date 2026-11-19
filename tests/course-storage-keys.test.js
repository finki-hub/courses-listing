import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const { fromStorageKeys, toStorageKeys } =
  await import('../src/lib/course-storage-keys.ts');

const course = (name, code, renamed) => ({
  '2023-available': 'TRUE',
  '2023-code': code,
  '2023-name': renamed,
  name,
});

const BEFORE = [course('Бази', 'F23B'), course('Алгоритми', 'F23A')];
const AFTER = [
  course('Бази', 'F23B'),
  course('Алгоритми', 'F23A', 'Алгоритми и структури'),
];

test('progress saved by code follows a renamed course', () => {
  const saved = toStorageKeys(
    { Алгоритми: 1, Бази: 2, Стар: 3 },
    BEFORE,
    '2023',
  );
  assert.deepEqual(saved, { F23A: 1, F23B: 2, Стар: 3 });
  assert.deepEqual(fromStorageKeys(saved, AFTER, '2023'), {
    'Алгоритми и структури': 1,
    Бази: 2,
    Стар: 3,
  });
});

test('records saved by name still load, and a code wins over a name', () => {
  assert.deepEqual(fromStorageKeys({ Бази: 2 }, AFTER, '2023'), { Бази: 2 });
  assert.deepEqual(fromStorageKeys({ F23B: 2, Бази: 1 }, AFTER, '2023'), {
    Бази: 2,
  });
  assert.deepEqual(fromStorageKeys({ F23B: 2 }, AFTER, '2018'), { F23B: 2 });
});
