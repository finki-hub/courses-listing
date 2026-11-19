import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';
import { makeCourse, passedAll } from './support/simulator-fixtures.js';

const { getSimulatorShareUrl, readSimulatorShareState, sharedStateConflicts } =
  await import('../src/lib/simulator-share.ts');
const { parseSimulatorUrlState, writeSimulatorUrlState } =
  await import('../src/lib/simulator-url-state.ts');

const COURSES = [
  makeCourse({ name: 'А', semester: 1 }),
  makeCourse({ name: 'Б', semester: 3 }),
];

const shareOf = (t, statuses, plan) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'location', descriptor);
    else Reflect.deleteProperty(globalThis, 'location');
  });
  const goTo = (href) => {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { href },
      writable: true,
    });
  };
  goTo('https://courses.example/?page=simulator');
  goTo(
    getSimulatorShareUrl({
      accreditation: '2023',
      courses: COURSES,
      hpcCompleted: false,
      plan,
      program: 'kn',
      seasonFilter: null,
      showOnlyEnabled: false,
      statuses,
      uniListCredits: 0,
    }),
  );
  return readSimulatorShareState();
};

test('a shared link is previewed only when it would replace saved progress', (t) => {
  const shared = shareOf(t, passedAll(['А']), { Б: 3 });
  const conflicts = (statuses, plan) =>
    sharedStateConflicts(COURSES, shared, { plan, statuses });

  assert.equal(conflicts({}, {}), false, 'nothing saved');
  assert.equal(
    conflicts({ Б: { listened: false, passed: false } }, {}),
    false,
    'only cleared statuses saved',
  );
  assert.equal(conflicts(passedAll(['А']), { Б: 3 }), false, 'same state');
  assert.equal(conflicts(passedAll(['Б']), { Б: 3 }), true, 'other statuses');
  assert.equal(conflicts(passedAll(['А']), { Б: 4 }), true, 'other plan');
  assert.equal(
    conflicts(passedAll(['А', 'Друг']), { Б: 3 }),
    true,
    'saved progress outside the shared courses',
  );
});

test('the simulator view round-trips through the URL', () => {
  const state = {
    level: 2,
    mode: 'plan',
    search: 'бази',
    season: 'winter',
    showOnlyEnabled: true,
    tags: ['databases', 'ai'],
    type: 'elective',
  };
  const params = new URLSearchParams('page=simulator&sim=x');
  writeSimulatorUrlState(params, state);
  assert.deepEqual(parseSimulatorUrlState(params), {
    ...state,
    tags: ['ai', 'databases'],
  });
  assert.equal(params.get('sim'), 'x');

  writeSimulatorUrlState(params, {
    level: null,
    mode: 'checklist',
    search: '',
    season: null,
    showOnlyEnabled: false,
    tags: [],
    type: 'all',
  });
  assert.equal(params.toString(), 'page=simulator&sim=x');
});

test('unknown simulator URL values fall back to the defaults', () => {
  assert.deepEqual(
    parseSimulatorUrlState(
      new URLSearchParams('view=x&slevel=9&sseason=spring&stype=y&stags=nope'),
    ),
    {
      level: null,
      mode: 'checklist',
      search: '',
      season: null,
      showOnlyEnabled: false,
      tags: [],
      type: 'all',
    },
  );
});
