import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const {
  buildEnglishNameIndex,
  createCourseNameTranslator,
  localizePrerequisiteText,
  translatesCourseNames,
} = await import('../src/lib/course-names.ts');
const { en } = await import('../src/lib/locales/en.ts');

const COURSES = [
  {
    '2018-name': 'Мрежна безбедност',
    '2023-name': 'Сајбер безбедност',
    cycle: 'first',
    name: 'Сајбер безбедност',
    'name-en': 'Cybersecurity',
  },
  {
    cycle: 'first',
    name: 'Компјутерски мрежи',
    'name-en': 'Computer networks',
  },
  {
    cycle: 'first',
    name: 'Компјутерски мрежи и безбедност',
    'name-en': 'Computer networks and security',
  },
  // A master's course with an undergraduate name keeps the undergraduate one.
  { cycle: 'second', name: 'Компјутерски мрежи', 'name-en': 'Networks (MSc)' },
  { cycle: 'first', name: 'Без превод' },
];

const index = buildEnglishNameIndex(COURSES);
const translate = createCourseNameTranslator(index);
const knownNames = index.keys().toArray();
const words = en.prerequisiteText;

test('every name a course goes by translates to its English name', () => {
  assert.equal(translate('Мрежна безбедност'), 'Cybersecurity');
  assert.equal(translate('Сајбер безбедност'), 'Cybersecurity');
  assert.equal(translate('  сајбер БЕЗБЕДНОСТ '), 'Cybersecurity');
  assert.equal(translate('Компјутерски мрежи'), 'Computer networks');
  assert.equal(translate('Без превод'), 'Без превод');
  assert.equal(translate('Непознат'), 'Непознат');
});

test('only English translates course names', () => {
  assert.equal(translatesCourseNames('en'), true);
  for (const language of ['mk', 'sq', 'tr']) {
    assert.equal(translatesCourseNames(language), false);
  }
});

const localize = (text) =>
  localizePrerequisiteText(text, { knownNames, translate, words });

test('a prerequisite translates its courses and the words between them', () => {
  assert.equal(
    localize('Компјутерски мрежи или компјутерски мрежи и безбедност'),
    'Computer networks or Computer networks and security',
  );
  assert.equal(
    localize('Сајбер безбедност и (Компјутерски мрежи или Без превод)'),
    'Cybersecurity and (Computer networks or Без превод)',
  );
  assert.equal(localize('150 кредити'), '150 credits');
  // Words inside course names are left alone.
  assert.equal(
    localize('Компјутерски мрежи и безбедност'),
    'Computer networks and security',
  );
});
