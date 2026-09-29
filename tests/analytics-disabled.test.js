import assert from 'node:assert/strict';
import { test } from 'node:test';
import { posthog } from 'posthog-js';
import { createRoot, createSignal } from 'solid-js';

import { useCourseSearchAnalytics } from '../src/components/use-course-search-analytics.ts';

test('search state and click handling remain usable with the real uninitialized SDK', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let change;
  let query;
  let linkage;
  const dispose = createRoot((cleanup) => {
    const [search, setSearch] = createSignal('');
    change = setSearch;
    query = search;
    linkage = useCourseSearchAnalytics(() => ({
      accreditation: null,
      level: null,
      query: search(),
      resultCount: 1,
      season: null,
      sortColumn: 'name',
      sortDirection: 'asc',
      tags: new Set(),
    }));
    return cleanup;
  });
  t.after(dispose);
  change('alpha');
  t.mock.timers.tick(500);
  assert.equal(query(), 'alpha');
  assert.equal(
    posthog.capture('result_clicked', { ...linkage(), position: 0 }),
    undefined,
  );
  change('');
  t.mock.timers.tick(500);
  assert.equal(query(), '');
  assert.deepEqual(linkage(), {});
});
