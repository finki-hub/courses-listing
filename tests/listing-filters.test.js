import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const {
  getAllStaff,
  getCourseCode,
  getCurrentEnrollment,
  getDistinctCredits,
  getLatestEnrollmentYears,
  isInactiveCourse,
} = await import('../src/lib/course-facts.ts');
const { filterCourses, sortCourses } =
  await import('../src/lib/course-filters.ts');
const {
  clearFilters,
  countActiveFilters,
  getActiveFilterSections,
  getFilterChips,
  removeFilterChip,
} = await import('../src/lib/listing-filter-chips.ts');
const { DEFAULT_LISTING_FILTERS } =
  await import('../src/lib/listing-url-state.ts');

// A 2023 course; `enrollment` maps academic years to student counts.
const makeCourse = ({ enrollment = {}, ...overrides }) => ({
  '2018-available': 'FALSE',
  '2023-available': 'TRUE',
  '2023-credits': '6',
  '2023-level': '2',
  '2023-semester': '3',
  '2023-state-kn': 'изборен',
  '2023-state-siis': 'нема',
  name: 'Course',
  professors: '',
  ...enrollment,
  ...overrides,
});

const WINTER = makeCourse({
  '2023-channel': '1',
  '2023-state-kn': 'задолжителен (сем. 3)',
  enrollment: { '2025/2026': '120', '2026/2027': '100' },
  name: 'Winter',
  professors: 'Костадин Мишев',
  tags: 'ai,web',
});
const SUMMER = makeCourse({
  '2023-credits': '4',
  '2023-semester': '4',
  assistants: 'Ана Тодоровска',
  enrollment: { '2025/2026': '300', '2026/2027': '0' },
  name: 'Summer',
  tags: 'web',
});
const RETIRED = makeCourse({
  enrollment: { '2020/2021': '50' },
  name: 'Retired',
  professors: '(неактивиран предмет)',
});
const NEVER = makeCourse({ '2023-semester': '5', name: 'Never' });
const COURSES = [WINTER, SUMMER, RETIRED, NEVER];

const names = (courses) => courses.map((course) => course.name);
const YEARS = getLatestEnrollmentYears(COURSES);
const filter = (criteria) =>
  names(
    filterCourses(COURSES, {
      ...DEFAULT_LISTING_FILTERS,
      enrollmentYears: YEARS,
      searchTerm: '',
      tags: new Set(),
      ...criteria,
    }),
  );

test('the latest enrollment year is tracked per season', () => {
  assert.deepEqual(YEARS, {
    all: '2026/2027',
    summer: '2025/2026',
    winter: '2026/2027',
  });
  assert.equal(getCurrentEnrollment(WINTER, YEARS), 100);
  assert.equal(getCurrentEnrollment(SUMMER, YEARS), 300);
});

test('a course is inactive when deactivated or never enrolled', () => {
  assert.deepEqual(names(COURSES.filter(isInactiveCourse)), [
    'Retired',
    'Never',
  ]);
});

test('staff and credits options come from the data', () => {
  assert.deepEqual(getAllStaff(COURSES), ['Ана Тодоровска', 'Костадин Мишев']);
  assert.deepEqual(getDistinctCredits(COURSES), [4, 6]);
});

test('curriculum filters match within the course accreditation', () => {
  assert.deepEqual(filter({ semester: 4 }), ['Summer']);
  assert.deepEqual(filter({ credits: 6, semester: 3 }), ['Winter', 'Retired']);
  assert.deepEqual(filter({ program: 'kn', programState: 'required' }), [
    'Winter',
  ]);
  assert.deepEqual(filter({ program: 'kn', programState: 'elective' }), [
    'Summer',
    'Retired',
    'Never',
  ]);
  assert.deepEqual(filter({ program: 'siis' }), []);
  assert.deepEqual(filter({ accreditation: '2018' }), []);
});

test('status filters hide inactive, unoffered and channel-less courses', () => {
  assert.deepEqual(filter({ hideInactive: true }), ['Winter', 'Summer']);
  assert.deepEqual(filter({ offeredOnly: true }), ['Winter', 'Summer']);
  assert.deepEqual(filter({ channelOnly: true }), ['Winter']);
  assert.deepEqual(filter({ staff: 'Ана Тодоровска' }), ['Summer']);
  assert.deepEqual(filter({ staff: 'todorov' }), ['Summer']);
});

test('tags match any or all of the selected ones', () => {
  const tags = new Set(['ai', 'web']);
  assert.deepEqual(filter({ tags }), ['Winter', 'Summer']);
  assert.deepEqual(filter({ tagMode: 'all', tags }), ['Winter']);
});

const sort = (column, direction) =>
  names(
    sortCourses([...COURSES, makeCourse({ '2023-semester': '', name: 'Z' })], {
      accreditation: null,
      column,
      direction,
      enrollmentYears: YEARS,
      language: 'mk',
    }),
  );

test('popularity and semester sorts put missing values last', () => {
  assert.deepEqual(sort('popularity', 'desc').slice(0, 2), [
    'Summer',
    'Winter',
  ]);
  assert.deepEqual(sort('semester', 'asc'), [
    'Retired',
    'Winter',
    'Summer',
    'Never',
    'Z',
  ]);
  assert.equal(sort('semester', 'desc').at(-1), 'Z');
});

test('chips list active filters and remove them one by one', () => {
  const filters = {
    ...DEFAULT_LISTING_FILTERS,
    hideInactive: true,
    program: 'kn',
    programState: 'required',
    query: ' web ',
    tags: ['ai'],
  };
  const chips = getFilterChips(filters);
  assert.deepEqual(chips, [
    { kind: 'query', value: 'web' },
    { kind: 'program', value: 'kn' },
    { kind: 'inactive', value: '' },
    { kind: 'tag', value: 'ai' },
  ]);
  const withoutProgram = removeFilterChip(filters, chips[1]);
  assert.equal(withoutProgram.program, null);
  assert.equal(withoutProgram.programState, null);
  assert.deepEqual(removeFilterChip(filters, chips[3]).tags, []);
  assert.equal(countActiveFilters(filters), 3);
  assert.equal(countActiveFilters(DEFAULT_LISTING_FILTERS), 0);
  const sections = getActiveFilterSections(filters);
  assert.equal(sections.size, 3);
  for (const section of ['program', 'status', 'topics']) {
    assert.ok(sections.has(section), section);
  }
  assert.equal(getActiveFilterSections(DEFAULT_LISTING_FILTERS).size, 0);
  assert.deepEqual(clearFilters({ ...filters, tagMode: 'all' }), {
    ...DEFAULT_LISTING_FILTERS,
    tagMode: 'all',
  });
});

test("the master's view never shows undergraduate-only chips", () => {
  const filters = {
    ...DEFAULT_LISTING_FILTERS,
    accreditation: '2023',
    cycle: 'master',
    level: 2,
    semester: 3,
    staff: 'Ана',
    tags: ['ai'],
  };
  assert.deepEqual(
    getFilterChips(filters).map((chip) => chip.kind),
    ['staff'],
  );
});

test('a course code follows the accreditation it is shown by', () => {
  const both = makeCourse({
    '2018-available': 'TRUE',
    '2018-code': 'F18L2W001',
    '2023-code': 'F23L2W001',
  });
  assert.equal(getCourseCode(both, null), 'F23L2W001');
  assert.equal(getCourseCode(both, '2018'), 'F18L2W001');
  assert.equal(getCourseCode(RETIRED, null), undefined);
});
