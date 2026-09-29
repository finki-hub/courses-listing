import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createRoot, createSignal } from 'solid-js';

const events = [];
const UUID_PATTERN = /^[\da-f-]{36}$/u;
mock.module('posthog-js', {
  namedExports: {
    posthog: {
      capture: (event, properties) => {
        events.push({ event, properties });
      },
    },
  },
});
const { useCourseSearchAnalytics } =
  await import('../src/components/use-course-search-analytics.ts');

test('Solid search attempts debounce, invalidate and dispose without stale linkage', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let change;
  let linkage;
  const dispose = createRoot((cleanup) => {
    const [context, setContext] = createSignal({
      accreditation: null,
      level: null,
      query: '',
      resultCount: 3,
      season: null,
      sortColumn: 'name',
      sortDirection: 'asc',
      tags: new Set(),
    });
    change = (patch) => setContext((previous) => ({ ...previous, ...patch }));
    linkage = useCourseSearchAnalytics(context);
    return cleanup;
  });
  t.after(dispose);
  t.mock.timers.tick(500);
  assert.equal(events.length, 0);
  change({ query: 'alpha' });
  assert.deepEqual(linkage(), {});
  t.mock.timers.tick(499);
  assert.equal(events.length, 0);
  t.mock.timers.tick(1);
  const first = linkage().search_attempt_id;
  assert.match(first, UUID_PATTERN);
  assert.equal(events[0].properties.search_attempt_id, first);
  assert.equal(events[0].properties.result_count, 3);
  change({ tags: new Set() });
  t.mock.timers.tick(500);
  assert.equal(events.length, 1);
  assert.equal(linkage().search_attempt_id, first);

  change({ query: 'none', resultCount: 0 });
  assert.deepEqual(linkage(), {});
  t.mock.timers.tick(500);
  const zero = linkage().search_attempt_id;
  assert.notEqual(zero, first);
  assert.deepEqual(
    events.slice(1).map(({ event }) => event),
    ['catalog_search', 'search_zero_results'],
  );
  assert.equal(events[1].properties.result_count, 0);
  assert.equal(events[2].properties.search_attempt_id, zero);

  change({ query: 'alpha', resultCount: 3 });
  assert.deepEqual(linkage(), {});
  t.mock.timers.tick(500);
  assert.notEqual(linkage().search_attempt_id, first);
  for (const patch of [
    { accreditation: '2023' },
    { level: 2 },
    { season: 'winter' },
    { tags: new Set(['ai']) },
    { tags: new Set(['web']) },
    { sortColumn: 'tags' },
    { sortDirection: 'desc' },
  ]) {
    const prior = linkage().search_attempt_id;
    change(patch);
    assert.deepEqual(linkage(), {});
    t.mock.timers.tick(500);
    assert.notEqual(linkage().search_attempt_id, prior);
  }
  const count = events.length;
  change({ tags: new Set(['ai', 'web']) });
  t.mock.timers.tick(500);
  const unordered = linkage().search_attempt_id;
  // eslint-disable-next-line perfectionist/sort-sets -- Exercise order-independent state identity.
  change({ tags: new Set(['web', 'ai']) });
  t.mock.timers.tick(500);
  assert.equal(linkage().search_attempt_id, unordered);
  assert.equal(events.length, count + 1);
  change({ resultCount: 2 });
  t.mock.timers.tick(250);
  change({ resultCount: 1 });
  t.mock.timers.tick(250);
  assert.deepEqual(linkage(), {});
  assert.equal(events.length, count + 1);
  t.mock.timers.tick(250);
  assert.equal(events.at(-1).properties.result_count, 1);
  const settledCount = events.length;
  change({ query: 'pending' });
  t.mock.timers.tick(200);
  change({ query: '' });
  assert.deepEqual(linkage(), {});
  t.mock.timers.tick(500);
  assert.equal(events.length, settledCount);
  change({ query: 'disposed' });
  dispose();
  t.mock.timers.tick(500);
  assert.deepEqual(linkage(), {});
  assert.equal(events.length, settledCount);
  for (const { properties } of events) {
    assert.equal('tags' in properties, false);
    assert.equal('state' in properties, false);
  }
});
