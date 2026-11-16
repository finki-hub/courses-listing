import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  findCourseByLinkValue,
  getCourseLinkValue,
  LISTING_FILTER_PARAMS,
  parseListingUrlState,
  writeListingUrlState,
} from '../src/lib/listing-url-state.ts';

const OPTIONS = {
  sortColumns: ['name', 'accreditation', 'channel', 'tags'],
  tags: ['delemangi', 'ai', 'coding', 'web'],
};

const DEFAULT_STATE = {
  accreditation: null,
  level: null,
  query: '',
  season: null,
  sortColumn: 'name',
  sortDirection: 'asc',
  tags: [],
};

const parse = (search) =>
  parseListingUrlState(new URLSearchParams(search), OPTIONS);

const write = (state, search = '') => {
  const params = new URLSearchParams(search);
  writeListingUrlState(params, state, OPTIONS);
  return params.toString();
};

test('an empty URL parses to the default listing state', () => {
  assert.deepEqual(parse(''), DEFAULT_STATE);
});

test('valid listing params round-trip through the URL', () => {
  const state = {
    accreditation: '2018',
    level: 2,
    query: 'веб прог',
    season: 'winter',
    sortColumn: 'channel',
    sortDirection: 'desc',
    tags: ['ai', 'web'],
  };
  assert.deepEqual(parse(write(state)), state);
});

test('defaults are omitted so URLs stay short', () => {
  assert.equal(write(DEFAULT_STATE), '');
  assert.equal(write({ ...DEFAULT_STATE, sortColumn: 'tags' }), 'sort=tags');
  assert.equal(write({ ...DEFAULT_STATE, sortDirection: 'desc' }), 'dir=desc');
});

test('invalid values fall back to defaults', () => {
  assert.deepEqual(
    parse('acc=2013&level=4&season=spring&sort=credits&dir=up&tags=,unknown,'),
    DEFAULT_STATE,
  );
});

test('tags are filtered to known ones, deduplicated and kept in canonical order', () => {
  assert.deepEqual(parse('tags=web,unknown,ai,web').tags, ['ai', 'web']);
  assert.equal(
    write({ ...DEFAULT_STATE, tags: ['web', 'delemangi'] }),
    'tags=delemangi%2Cweb',
  );
});

test('writing clears stale listing params and keeps unrelated ones', () => {
  const result = new URLSearchParams(
    write(DEFAULT_STATE, 'page=listing&q=old&acc=2023&tags=ai&course=X'),
  );
  assert.equal(result.get('page'), 'listing');
  assert.equal(result.get('course'), 'X');
  for (const param of LISTING_FILTER_PARAMS) {
    assert.equal(result.has(param), false, param);
  }
});

const COURSES = [
  {
    '2018-code': 'F18L3W024',
    '2018-name': 'Веб програмирање',
    '2023-code': 'F23L3W024',
    '2023-name': 'Веб програмирање',
    name: 'Веб програмирање',
    'name-en': 'Web Programming',
  },
  {
    '2018-code': 'F18L3S139',
    '2018-name': 'Напредни теми од криптографија',
    name: 'Напредни теми од криптографија',
  },
  { name: 'Предмет без код' },
];

test('course links prefer the newest code and fall back to the name', () => {
  assert.equal(getCourseLinkValue(COURSES[0]), 'F23L3W024');
  assert.equal(getCourseLinkValue(COURSES[1]), 'F18L3S139');
  assert.equal(getCourseLinkValue(COURSES[2]), 'Предмет без код');
  assert.equal(
    getCourseLinkValue({ '2023-code': '', name: 'Празен код' }),
    'Празен код',
  );
});

test('course links resolve by either code or any name, ignoring case', () => {
  assert.equal(findCourseByLinkValue(COURSES, 'F23L3W024'), COURSES[0]);
  assert.equal(findCourseByLinkValue(COURSES, 'f18l3w024'), COURSES[0]);
  assert.equal(findCourseByLinkValue(COURSES, 'web programming'), COURSES[0]);
  assert.equal(
    findCourseByLinkValue(COURSES, ' Напредни теми од криптографија '),
    COURSES[1],
  );
  assert.equal(findCourseByLinkValue(COURSES, 'Предмет без код'), COURSES[2]);
});

test('missing or unknown course links resolve to nothing', () => {
  assert.equal(findCourseByLinkValue(COURSES, null), undefined);
  assert.equal(findCourseByLinkValue(COURSES, '  '), undefined);
  assert.equal(findCourseByLinkValue(COURSES, 'F23L9X999'), undefined);
});
