import assert from 'node:assert/strict';
import { test } from 'node:test';

import './alias-hooks.js';

const { buildPrerequisiteGraph, collectLayers } =
  await import('../src/lib/prerequisite-graph.ts');

const BASICS = 'Програмирање';

const course = (name, prerequisite, semester = 1) => ({
  name,
  prerequisite,
  semester,
});

const COURSES = [
  course(BASICS),
  course('Алгоритми', BASICS, 2),
  course('Бази', 'Алгоритми или Програмирање', 3),
  course('Системи', 'Бази и Алгоритми', 5),
  course('Проект', 'Положени 180 кредити', 7),
];

test('the graph links each course to what it requires and unlocks', () => {
  const graph = buildPrerequisiteGraph(COURSES);
  assert.deepEqual(graph.requires.get('Системи'), ['Бази', 'Алгоритми']);
  assert.deepEqual(graph.requires.get('Проект'), []);
  assert.deepEqual(graph.unlocks.get(BASICS), ['Алгоритми', 'Бази']);
  assert.equal(graph.unlocks.get('Системи'), undefined);
});

test('layers list each course once, at its shortest distance', () => {
  const graph = buildPrerequisiteGraph(COURSES);
  assert.deepEqual(collectLayers(BASICS, graph.unlocks), [
    ['Алгоритми', 'Бази'],
    ['Системи'],
  ]);
  assert.deepEqual(collectLayers('Системи', graph.requires), [
    ['Бази', 'Алгоритми'],
    [BASICS],
  ]);
  assert.deepEqual(collectLayers('Проект', graph.requires), []);
});

test('cycles end instead of looping', () => {
  const graph = buildPrerequisiteGraph([course('А', 'Б'), course('Б', 'А')]);
  assert.deepEqual(collectLayers('А', graph.unlocks), [['Б']]);
});
