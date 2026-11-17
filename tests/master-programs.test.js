/* eslint-disable camelcase -- the data files use snake_case keys. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const {
  buildProgramIndex,
  formatProgramSummary,
  getEntrySeason,
  getMasterCredits,
  getMasterSeason,
  getProgramEntries,
  getProgramTitle,
  groupProgramEntries,
  matchesMasterCriteria,
  summarizePrograms,
} = await import('../src/lib/master-programs.ts');
const { en } = await import('../src/lib/locales/en.ts');

const DATA_SCIENCE = 'Data Science';

const row = (overrides) => ({
  code: null,
  course: DATA_SCIENCE,
  credits: 6,
  cycle: 'second',
  group: null,
  group_name: null,
  kind: 'elective',
  program: 'BI23_1',
  semester: null,
  ...overrides,
});

const ROWS = [
  row({ code: 'DS003', kind: 'mandatory', program: 'DS23_1', semester: 1 }),
  row({ group: 'faculty_winter', program: 'BI23_1' }),
  row({ group: 'faculty_winter', program: 'BKK23_2' }),
  row({ group: 'named', group_name: 'Data list', program: 'AI23_2' }),
  // The same name in the undergraduate cycle stays out of the master's view.
  row({ course: DATA_SCIENCE, cycle: 'first', program: 'DS23_1' }),
];

const index = buildProgramIndex(ROWS);
const course = (cycle) => ({ cycle, name: DATA_SCIENCE, professors: '' });
const entries = getProgramEntries(index, course('second'));

test("rows join master's courses on name and cycle", () => {
  assert.equal(entries.length, 4);
  assert.equal(getProgramEntries(index, course('first')).length, 0);
  assert.equal(getProgramEntries(index, course()).length, 0);
});

test("a course's season comes from its list, else its semester parity", () => {
  assert.equal(getEntrySeason(row({ group: 'program_summer' })), 'summer');
  assert.equal(getEntrySeason(row({ semester: 1 })), 'winter');
  assert.equal(getEntrySeason(row({ semester: 2 })), 'summer');
  assert.equal(getEntrySeason(row({})), undefined);
  assert.equal(getMasterSeason(entries), 'winter');
  assert.equal(getMasterCredits(entries), 6);
});

test('programs are summarized as mandatory ones and an elective count', () => {
  const summary = summarizePrograms(entries);
  assert.deepEqual(summary, { electiveCount: 3, mandatory: ['DS23_1'] });
  assert.equal(
    formatProgramSummary(summary, en, 'en'),
    'Mandatory in DS23_1 · elective in 3 programs',
  );
  assert.equal(
    formatProgramSummary({ electiveCount: 1, mandatory: [] }, en, 'en'),
    'Elective in 1 program',
  );
  assert.equal(
    formatProgramSummary({ electiveCount: 0, mandatory: [] }, en, 'en'),
    en.masters.noPrograms,
  );
});

const match = (criteria) =>
  matchesMasterCriteria(entries, {
    credits: null,
    kind: null,
    program: null,
    season: null,
    ...criteria,
  });

test('the program filter narrows kind, season and credits', () => {
  assert.ok(match({ kind: 'required', program: 'DS23_1' }));
  assert.ok(!match({ kind: 'elective', program: 'DS23_1' }));
  assert.ok(match({ kind: 'elective', season: 'winter' }));
  assert.ok(!match({ program: 'XX23_1' }));
  assert.ok(!match({ credits: 4 }));
});

test('electives are grouped by list, mandatory placements first', () => {
  const { electives, mandatory } = groupProgramEntries(entries);
  assert.deepEqual(
    mandatory.map((entry) => entry.program),
    ['DS23_1'],
  );
  assert.deepEqual(
    electives.map((group) => [group.kind, group.name, group.entries.length]),
    [
      ['facultyWinter', null, 2],
      ['named', 'Data list', 1],
    ],
  );
});

test('program titles fall back to English, then to the code', () => {
  const program = {
    code: 'DS23_1',
    cycle: 'second',
    ects: 60,
    title: null,
    title_en: DATA_SCIENCE,
  };
  assert.equal(getProgramTitle(program, 'DS23_1', 'mk'), DATA_SCIENCE);
  assert.equal(
    getProgramTitle({ ...program, title: 'Наука за податоци' }, 'DS23_1', 'en'),
    DATA_SCIENCE,
  );
  assert.equal(getProgramTitle(undefined, 'DS23_1', 'mk'), 'DS23_1');
});
