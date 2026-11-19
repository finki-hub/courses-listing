import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const {
  getSavedShareUrl,
  mergeSavedValues,
  parseSavedParam,
  parseSavedStorage,
  resolveSavedValues,
  serializeSavedParam,
  serializeSavedStorage,
  toggleSavedValue,
} = await import('../src/lib/saved-courses.ts');
const { parseListingUrlState, writeListingUrlState } =
  await import('../src/lib/listing-url-state.ts');
const { clearFilters, countActiveFilters, getFilterChips, removeFilterChip } =
  await import('../src/lib/listing-filter-chips.ts');
const { filterCourses } = await import('../src/lib/course-filters.ts');

const ADVANCED = 'F23L3W140';
const DATA = 'Data Engineering';
const COURSES = [
  { '2023-code': ADVANCED, name: 'Advanced programming' },
  { '2018-code': 'F18L2W001', name: 'Algorithms' },
  { name: DATA },
  { name: 'Names, with a comma' },
];
const OPTIONS = { programs: [], sortColumns: ['name'], tags: [] };

test('stored values survive a round trip and tolerate junk', () => {
  const values = [ADVANCED, DATA];
  assert.deepEqual(parseSavedStorage(serializeSavedStorage(values)), values);
  assert.deepEqual(parseSavedStorage(null), []);
  assert.deepEqual(parseSavedStorage('not json'), []);
  assert.deepEqual(parseSavedStorage('{"a":1}'), []);
  assert.deepEqual(parseSavedStorage('["a",1,"a"," ","b"]'), ['a', 'b']);
});

test('a link param carries codes and names, even with commas', () => {
  const values = [ADVANCED, 'Names, with a comma', 'Дата'];
  assert.deepEqual(parseSavedParam(serializeSavedParam(values)), values);
  assert.deepEqual(parseSavedParam('A,B,,A'), ['A', 'B']);
  assert.deepEqual(parseSavedParam(null), []);
  assert.deepEqual(parseSavedParam('%E0%A4%A'), ['%E0%A4%A']);
});

test('a share link keeps the codes readable and reads back', () => {
  const url = getSavedShareUrl('https://example.com/app/?q=x&course=y#top', [
    ADVANCED,
    'F18L2W001',
    'Names, with a comma',
  ]);
  assert.ok(
    url.startsWith('https://example.com/app/?saved=F23L3W140,F18L2W001,'),
  );
  assert.ok(!url.includes('#'));
  assert.ok(!url.includes('q=x'));
  const param = new URL(url).searchParams.get('saved');
  assert.deepEqual(parseSavedParam(param), [
    ADVANCED,
    'F18L2W001',
    'Names, with a comma',
  ]);
});

test('values are checked against the data', () => {
  assert.deepEqual(
    resolveSavedValues(COURSES, [
      'f23l3w140',
      'F18L2W001',
      DATA,
      'F00NOPE',
      ADVANCED,
    ]),
    [ADVANCED, 'F18L2W001', DATA],
  );
});

test('toggling and merging keep values distinct', () => {
  assert.deepEqual(toggleSavedValue(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(toggleSavedValue(['a', 'b'], 'a'), ['b']);
  assert.deepEqual(mergeSavedValues(['a', 'b'], ['b', 'c']), ['a', 'b', 'c']);
});

test('the saved filter lives in the URL, chips and count', () => {
  const state = parseListingUrlState(
    new URLSearchParams('savedonly=1'),
    OPTIONS,
  );
  assert.equal(state.savedOnly, true);
  assert.equal(
    parseListingUrlState(new URLSearchParams(''), OPTIONS).savedOnly,
    false,
  );

  const params = new URLSearchParams('saved=A,B');
  writeListingUrlState(params, state, { tags: [] });
  assert.equal(params.get('savedonly'), '1');
  // The shared set is not the filter's to touch.
  assert.equal(params.get('saved'), 'A,B');
  writeListingUrlState(params, { ...state, savedOnly: false }, { tags: [] });
  assert.equal(params.has('savedonly'), false);

  assert.deepEqual(
    getFilterChips(state).map((chip) => chip.kind),
    ['saved'],
  );
  assert.equal(countActiveFilters(state), 1);
  assert.equal(
    removeFilterChip(state, { kind: 'saved', value: '' }).savedOnly,
    false,
  );
  assert.equal(clearFilters(state).savedOnly, false);
  const master = { ...state, cycle: 'master' };
  assert.equal(countActiveFilters(master), 1);
});

test('only the saved courses match when a set is given', () => {
  const criteria = {
    accreditation: null,
    level: null,
    searchTerm: '',
    season: null,
    tags: new Set(),
  };
  const names = (savedValues) =>
    filterCourses(COURSES, { ...criteria, savedValues }).map(
      (course) => course.name,
    );
  assert.equal(names().length, 4);
  assert.deepEqual(names(new Set([ADVANCED, DATA])), [
    'Advanced programming',
    DATA,
  ]);
  assert.deepEqual(names(new Set()), []);
});
