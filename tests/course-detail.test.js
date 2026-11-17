import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier.startsWith('@/')
        ? new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href
        : specifier,
      context,
    );
  },
});

const {
  canMergeAccreditationDetails,
  getAccreditationDetails,
  getProgramStateGroups,
  indexCoursesByName,
  linkPrerequisiteText,
} = await import('../src/lib/course-detail.ts');

const COURSE = {
  '2018-available': 'TRUE',
  '2018-channel': '1',
  '2018-code': 'F18L3W024',
  '2018-credits': '6',
  '2018-level': '3',
  '2018-name': 'Веб програмирање',
  '2018-prerequisite': 'Алгоритми и податочни структури',
  '2018-semester': '5',
  '2018-state-kn': 'изборен',
  '2023-available': 'TRUE',
  '2023-channel': '1',
  '2023-code': 'F23L3W024',
  '2023-level': '3',
  '2023-name': 'Веб програмирање',
  '2023-prerequisite': 'Алгоритми и податочни структури',
  '2023-semester': '5',
  '2023-state-imb': 'нема',
  '2023-state-ki': 'задолжителен (сем. 7)',
  '2023-state-kn': 'изборен',
  '2023-state-pit': 'задолжителен (сем. 5)',
  name: 'Веб програмирање',
  professors: '',
};

const details = (overrides, accreditation = '2023') =>
  getAccreditationDetails({ ...COURSE, ...overrides }, accreditation);

test('accreditation details read credits, channel and the default credits', () => {
  const entry = details({});
  assert.equal(entry.credits, 6);
  assert.equal(entry.channel, true);
  assert.equal(entry.code, 'F23L3W024');
  assert.equal(details({ '2023-available': 'FALSE' }), undefined);
});

test('program states group by kind in a fixed order and keep the source text', () => {
  assert.deepEqual(getProgramStateGroups(COURSE, '2023'), [
    {
      kind: 'required',
      programs: [{ label: 'ПИТ', state: 'задолжителен (сем. 5)' }],
    },
    {
      kind: 'required-4yr',
      programs: [{ label: 'КИ', state: 'задолжителен (сем. 7)' }],
    },
    { kind: 'elective', programs: [{ label: 'КН', state: 'изборен' }] },
    { kind: 'faculty-list', programs: [{ label: 'ИМБ', state: 'нема' }] },
  ]);
});

test('accreditations merge only when every shared field matches', () => {
  const base = details({}, '2018');
  assert.equal(canMergeAccreditationDetails(details({}), base), true);
  for (const field of [
    'credits',
    'level',
    'name',
    'prerequisite',
    'semester',
  ]) {
    const changed = details({ [`2023-${field}`]: '9' });
    assert.equal(canMergeAccreditationDetails(changed, base), false, field);
  }
  assert.equal(
    canMergeAccreditationDetails(details({ '2023-channel': '0' }), base),
    false,
  );
});

test('prerequisite text links known courses and keeps the source text', () => {
  const names = [
    'Алгоритми и податочни структури',
    'Примена на алгоритми и податочни структури',
    'Компјутерски мрежи',
  ];
  const text =
    'Примена на алгоритми и податочни структури или компјутерски мрежи (5 сем.)';
  const segments = linkPrerequisiteText(text, names);
  assert.equal(segments.map((segment) => segment.text).join(''), text);
  assert.deepEqual(
    segments
      .filter((segment) => segment.course)
      .map((segment) => segment.course),
    ['Примена на алгоритми и податочни структури', 'Компјутерски мрежи'],
  );
  assert.deepEqual(linkPrerequisiteText('120 кредити', names), [
    { text: '120 кредити' },
  ]);
});

test('courses are indexed by the name their accreditation uses', () => {
  const renamed = { ...COURSE, '2023-name': 'Веб апликации' };
  assert.equal(
    indexCoursesByName([renamed], '2023').get('Веб апликации'),
    renamed,
  );
  assert.equal(
    indexCoursesByName([renamed], '2018').get('Веб програмирање'),
    renamed,
  );
});
