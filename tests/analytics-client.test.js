/* eslint-disable camelcase -- PostHog event props are snake_case. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

// A fresh module instance per case, since the client keeps module state.
const instances = { count: 0 };
const loadClient = () => {
  instances.count += 1;
  return import(`../src/lib/analytics-client.ts?case=${instances.count}`);
};

const createRecorder = () => {
  const events = [];
  return {
    client: {
      capture: (event, properties) => {
        events.push({ event, properties });
      },
    },
    events,
  };
};

test('events before startup are dropped when analytics is disabled', async () => {
  const { capture } = await loadClient();
  assert.equal(capture('result_clicked', { position: 0 }), undefined);
});

test('events wait for the scheduled load, then flush in order', async () => {
  const { capture, startAnalytics } = await loadClient();
  const { client, events } = createRecorder();
  let runScheduled;
  let loads = 0;
  const started = startAnalytics(
    () => {
      loads += 1;
      return Promise.resolve(client);
    },
    (run) => {
      runScheduled = run;
    },
  );
  capture('catalog_query_intent', { result_count: 1 });
  capture('search_zero_results');
  assert.equal(loads, 0);
  assert.equal(events.length, 0);
  runScheduled();
  await started;
  assert.equal(loads, 1);
  assert.deepEqual(events, [
    { event: 'catalog_query_intent', properties: { result_count: 1 } },
    { event: 'search_zero_results', properties: undefined },
  ]);
  capture('result_clicked', { position: 2 });
  assert.deepEqual(events.at(-1), {
    event: 'result_clicked',
    properties: { position: 2 },
  });
  await startAnalytics(() => Promise.reject(new Error('second start')));
  assert.equal(loads, 1);
});

test('a failed load discards queued events and later captures', async () => {
  const { capture, startAnalytics } = await loadClient();
  const started = startAnalytics(
    () => Promise.reject(new Error('blocked')),
    (run) => {
      run();
    },
  );
  capture('catalog_query_intent', { result_count: 1 });
  await started;
  assert.equal(capture('result_clicked', { position: 0 }), undefined);
});

test('the startup queue is bounded', async () => {
  const { capture, startAnalytics } = await loadClient();
  const { client, events } = createRecorder();
  let runScheduled;
  const started = startAnalytics(
    () => Promise.resolve(client),
    (run) => {
      runScheduled = run;
    },
  );
  for (let index = 0; index < 60; index += 1) {
    capture('catalog_refinement', { result_count: index });
  }
  runScheduled();
  await started;
  assert.equal(events.length, 50);
  assert.equal(events[0].properties.result_count, 10);
  assert.equal(events.at(-1).properties.result_count, 59);
});

test('without requestIdleCallback the load falls back to a timer', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { capture, startAnalytics } = await loadClient();
  const { client, events } = createRecorder();
  const started = startAnalytics(() => Promise.resolve(client));
  capture('search_zero_results');
  assert.equal(events.length, 0);
  t.mock.timers.tick(1);
  await started;
  assert.deepEqual(
    events.map(({ event }) => event),
    ['search_zero_results'],
  );
});
