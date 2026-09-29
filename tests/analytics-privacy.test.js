/* eslint-disable camelcase -- Assert the SDK's configuration and wire fields. */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { createRoot, createSignal } from 'solid-js';

import {
  createAnalyticsConfig,
  sanitizeAnalyticsEvent,
} from '../src/lib/analytics-privacy.ts';

const ID = '11111111-1111-4111-8111-111111111111';
const REVISION = 'a'.repeat(40);
const TOKEN = 'test-public-key';
const PRIVATE = 'TEST_PRIVATE_STUDY_PLAN';
const PRIVATE_URL = `https://courses.example/?sim=${PRIVATE}&utm_source=${PRIVATE}#${PRIVATE}`;
const RAW_QUERY = 'private@example.invalid secret search /?token=test';
const QUERY_VARIANTS = [
  RAW_QUERY,
  encodeURIComponent(RAW_QUERY),
  new URLSearchParams({ q: RAW_QUERY }).toString().slice(2),
];

test('allowlist rebuilds both payload levels and preserves only event-specific fields', () => {
  for (const [name, business] of [
    ['catalog_query_intent', { result_count: 2 }],
    ['catalog_refinement', { result_count: 1 }],
    ['search_zero_results', {}],
    ['result_clicked', { position: 0, result_id: 'Public course' }],
  ]) {
    const input = {
      $set: { profile: { url: PRIVATE_URL } },
      $set_once: { $initial_referrer: PRIVATE_URL },
      $unset: [PRIVATE],
      event: name,
      extra: { nested: PRIVATE_URL },
      properties: {
        ...business,
        $current_url: PRIVATE_URL,
        $device_id: ID,
        $exception_list: [{ value: PRIVATE }],
        $lib_version: '1.434.8',
        $referrer: PRIVATE_URL,
        $session_entry_url: PRIVATE_URL,
        $session_id: ID,
        $set: { nested: PRIVATE_URL },
        $set_once: { nested: PRIVATE_URL },
        $window_id: ID,
        analytics_schema_version: 'spoof',
        app_revision: PRIVATE,
        distinct_id: ID,
        filter: { query: RAW_QUERY },
        query: RAW_QUERY,
        query_hash: RAW_QUERY,
        query_length: RAW_QUERY.length,
        script: RAW_QUERY,
        search_attempt_id: ID,
        service: PRIVATE,
        sim: PRIVATE,
        suggestions: [RAW_QUERY],
        token: PRIVATE,
        utm_source: PRIVATE,
      },
      query: RAW_QUERY,
      // eslint-disable-next-line unicorn/prefer-temporal -- CaptureResult requires an SDK Date.
      timestamp: new Date(1_767_225_600_000),
      uuid: ID,
    };
    const result = sanitizeAnalyticsEvent(input, TOKEN, REVISION);
    assert.deepEqual(result, {
      event: name,
      properties: {
        ...business,
        $device_id: ID,
        $lib: 'web',
        $lib_version: '1.434.8',
        $process_person_profile: false,
        $session_id: ID,
        $window_id: ID,
        analytics_schema_version: 2,
        app_revision: REVISION,
        distinct_id: ID,
        search_attempt_id: ID,
        service: 'courses-listing',
        token: TOKEN,
      },
      timestamp: input.timestamp,
      uuid: ID,
    });
    assert.equal(JSON.stringify(result).includes(PRIVATE), false);
    for (const variant of QUERY_VARIANTS)
      assert.equal(JSON.stringify(result).includes(variant), false);
    assert.equal(input.properties.$current_url, PRIVATE_URL);
    assert.equal(
      'app_revision' in sanitizeAnalyticsEvent(input, TOKEN).properties,
      false,
    );
  }
});

test('malformed nested business/technical fields cannot carry URL metadata', () => {
  const result = sanitizeAnalyticsEvent(
    {
      event: 'catalog_query_intent',
      properties: {
        $lib_version: PRIVATE_URL,
        distinct_id: PRIVATE_URL,
        query: { url: PRIVATE_URL },
        result_count: -1,
        search_attempt_id: PRIVATE_URL,
      },
      uuid: ID,
    },
    TOKEN,
    'INVALID',
  );
  assert.deepEqual(result.properties, {
    $lib: 'web',
    $process_person_profile: false,
    analytics_schema_version: 2,
    service: 'courses-listing',
    token: TOKEN,
  });
  assert.equal(sanitizeAnalyticsEvent(null, TOKEN, REVISION), null);
  for (const uuid of [undefined, '', RAW_QUERY, { nested: RAW_QUERY }]) {
    assert.equal(
      sanitizeAnalyticsEvent(
        { event: 'catalog_query_intent', properties: {}, uuid },
        TOKEN,
        REVISION,
      ),
      null,
    );
  }
  for (const timestamp of [undefined, RAW_QUERY, { nested: RAW_QUERY }]) {
    const event = sanitizeAnalyticsEvent(
      { event: 'catalog_query_intent', properties: {}, timestamp, uuid: ID },
      TOKEN,
      REVISION,
    );
    assert.equal('timestamp' in event, false);
  }
  for (const event of [
    '$autocapture',
    '$pageview',
    '$pageleave',
    '$exception',
    '$snapshot',
    '$identify',
    '$feature_flag_called',
    'catalog_search',
    'unknown',
  ]) {
    assert.equal(
      sanitizeAnalyticsEvent(
        { event, properties: { secret: PRIVATE }, uuid: ID },
        TOKEN,
        REVISION,
      ),
      null,
    );
  }
  for (const version of [undefined, null, 1, 99, '2', { nested: RAW_QUERY }]) {
    const sanitized = sanitizeAnalyticsEvent(
      {
        event: 'catalog_query_intent',
        properties: { analytics_schema_version: version, query: RAW_QUERY },
        uuid: ID,
      },
      TOKEN,
    );
    assert.equal(sanitized.properties.analytics_schema_version, 2);
    assert.equal('query' in sanitized.properties, false);
  }
});

const exerciseSearchPayloads = async (t, sdk, requests) => {
  const { useCourseSearchAnalytics } =
    await import('../src/components/use-course-search-analytics.ts');
  // Exercise the real search function and Solid hook through SDK serialization.
  const aliases = registerHooks({
    resolve(specifier, context, nextResolve) {
      return nextResolve(
        specifier.startsWith('@/')
          ? new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href
          : specifier,
        context,
      );
    },
  });
  t.after(() => aliases.deregister());
  const { filterCourses } = await import('../src/lib/course-filters.ts');
  let updateSearch;
  let updateTags;
  let results;
  let linkage;
  const disposeSearch = createRoot((cleanup) => {
    const [query, setQuery] = createSignal('');
    const [tags, setTags] = createSignal(new Set());
    updateSearch = setQuery;
    updateTags = setTags;
    const criteria = () => ({
      accreditation: null,
      level: null,
      searchTerm: query(),
      season: null,
      tags: tags(),
    });
    results = () =>
      filterCourses(
        [{ name: 'Public course', professors: 'Public professor' }],
        criteria(),
      );
    linkage = useCourseSearchAnalytics(() => ({
      accreditation: null,
      level: null,
      query: query(),
      resultCount: results().length,
      season: null,
      sortColumn: 'name',
      sortDirection: 'asc',
      tags: tags(),
    }));
    return cleanup;
  });
  t.after(disposeSearch);
  assert.equal(results().length, 1);
  updateSearch(RAW_QUERY);
  assert.equal(results().length, 0);
  t.mock.timers.tick(500);
  updateTags(new Set(['private-filter-sentinel']));
  assert.deepEqual(linkage(), {});
  t.mock.timers.tick(500);
  updateSearch('Public');
  updateTags(new Set());
  t.mock.timers.tick(500);
  assert.equal(results().length, 1);
  sdk.capture('result_clicked', {
    ...linkage(),
    position: 0,
    result_id: results()[0].name,
  });
  await Promise.resolve();
  await Promise.resolve();
  const hookPayloads = requests
    .slice(4)
    .map(({ body }) => JSON.parse(body).batch[0]);
  assert.deepEqual(
    hookPayloads.map(({ event }) => event),
    [
      'catalog_query_intent',
      'search_zero_results',
      'catalog_refinement',
      'search_zero_results',
      'catalog_query_intent',
      'result_clicked',
    ],
  );
  assert.equal(
    hookPayloads[0].properties.search_attempt_id,
    hookPayloads[1].properties.search_attempt_id,
  );
  assert.equal(
    hookPayloads[2].properties.search_attempt_id,
    hookPayloads[3].properties.search_attempt_id,
  );
  assert.notEqual(
    hookPayloads[0].properties.search_attempt_id,
    hookPayloads[2].properties.search_attempt_id,
  );
  assert.equal(
    hookPayloads[4].properties.search_attempt_id,
    hookPayloads[5].properties.search_attempt_id,
  );
  for (const { body } of requests) {
    for (const variant of [...QUERY_VARIANTS, 'private-filter-sentinel'])
      assert.equal(body.includes(variant), false);
    const { properties } = JSON.parse(body).batch[0];
    assert.equal('query' in properties, false);
    assert.equal(properties.analytics_schema_version, 2);
    assert.equal(properties.$process_person_profile, false);
  }
};

test('real SDK serializes only approved captures; remote replay and opt-out stay disabled', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  // No browser/server dependency: provide only a location, and intercept fetch
  // before SDK import. No real request, beacon, or external script can run.
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: new URL(PRIVATE_URL),
  });
  t.after(() => {
    Reflect.deleteProperty(globalThis, 'location');
  });
  const requests = [];
  t.mock.method(globalThis, 'fetch', (url, options) => {
    requests.push({ body: options.body, url });
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
  const { PostHog, posthog: sdk } = await import('posthog-js');
  const { useCourseSearchAnalytics } =
    await import('../src/components/use-course-search-analytics.ts');
  const enriched = [];
  const config = createAnalyticsConfig(
    TOKEN,
    'https://ingest.example',
    REVISION,
  );
  sdk.init(TOKEN, {
    ...config,
    before_send: (event) => {
      enriched.push(event);
      return config.before_send(event);
    },
    disable_compression: true,
    // Test isolation and inspectable real SDK JSON serialization.
    persistence: 'memory',
    request_batching: false,
  });
  t.after(async () => {
    await sdk.shutdown();
  });
  for (const field of [
    'autocapture',
    'capture_exceptions',
    'capture_pageview',
    'capture_pageleave',
    'capture_performance',
    'capture_heatmaps',
    'save_campaign_params',
    'save_referrer',
  ]) {
    assert.equal(sdk.config[field], false);
  }
  assert.equal(sdk.config.disable_session_recording, true);
  assert.equal(sdk.config.disable_external_dependency_loading, true);
  assert.equal(sdk.config.advanced_disable_flags, true);
  assert.equal(config.logs.beforeSend({ body: PRIVATE }), null);
  assert.equal(config.metrics.beforeSend({ name: PRIVATE }), null);
  sdk.sessionRecording.onRemoteConfig({
    config: { sessionRecording: { enabled: true } },
    ok: true,
  });
  assert.equal(sdk.config.disable_session_recording, true);
  assert.equal(sdk.sessionRecording.started, false);
  assert.equal(requests.length, 0);

  sdk.register({
    $initial_referrer: PRIVATE_URL,
    $referrer: PRIVATE_URL,
    sim: PRIVATE,
    utm_source: PRIVATE,
  });
  for (const event of [
    '$autocapture',
    '$pageview',
    '$pageleave',
    '$snapshot',
    'catalog_search',
    'unknown',
  ]) {
    assert.equal(sdk.capture(event, { private: PRIVATE }), undefined);
  }
  sdk.captureException(new Error(PRIVATE));
  sdk.captureLog({ body: PRIVATE, level: 'error' });
  sdk.logs.flushLogs();
  sdk.metrics.count(PRIVATE);
  await sdk.metrics.flush();
  assert.equal(requests.length, 0);
  for (const [event, business] of [
    ['catalog_query_intent', { result_count: 2 }],
    ['catalog_refinement', { result_count: 1 }],
    ['search_zero_results', {}],
    ['result_clicked', { position: 0, result_id: 'Public course' }],
  ]) {
    const result = sdk.capture(
      event,
      {
        ...business,
        $set: { nested: PRIVATE_URL },
        analytics_schema_version: 'spoof',
        app_revision: 'spoof',
        nested: { query: RAW_QUERY },
        query: RAW_QUERY,
        search_attempt_id: ID,
      },
      { $set: { nested: PRIVATE_URL }, $set_once: { nested: PRIVATE_URL } },
    );
    assert.equal(result.properties.app_revision, REVISION);
    assert.equal(result.properties.analytics_schema_version, 2);
    assert.equal(result.properties.search_attempt_id, ID);
    for (const [key, value] of Object.entries(business))
      assert.equal(result.properties[key], value);
    assert.equal(
      enriched.at(-1).properties.$current_url.includes(PRIVATE),
      true,
    );
    assert.equal(enriched.at(-1).$set.nested, PRIVATE_URL);
  }
  // Let the intercepted fetch response finish without opening any network socket.
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(requests.length, 4);
  for (const { body, url } of requests) {
    assert.equal(url, 'https://ingest.example/e/');
    assert.equal(typeof body, 'string');
    assert.equal(body.includes(PRIVATE), false);
    for (const variant of QUERY_VARIANTS)
      assert.equal(body.includes(variant), false);
    const payload = JSON.parse(body);
    assert.equal(payload.api_key, TOKEN);
    assert.equal(payload.batch.length, 1);
    assert.equal(payload.batch[0].properties.app_revision, REVISION);
    assert.equal(payload.batch[0].properties.analytics_schema_version, 2);
  }
  await exerciseSearchPayloads(t, sdk, requests);
  const sentCount = requests.length;
  sdk.opt_out_capturing();
  assert.equal(sdk.has_opted_out_capturing(), true);
  assert.equal(
    sdk.capture('catalog_query_intent', { result_count: 1 }),
    undefined,
  );
  assert.equal(requests.length, sentCount);
  let setSearch;
  let currentSearch;
  const dispose = createRoot((cleanup) => {
    const [search, update] = createSignal('');
    setSearch = update;
    currentSearch = search;
    useCourseSearchAnalytics(() => ({
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
  setSearch('opted-out search');
  t.mock.timers.tick(500);
  assert.equal(currentSearch(), 'opted-out search');
  assert.equal(requests.length, sentCount);
  const missingKey = new PostHog();
  // The app's empty-key guard leaves the SDK uninitialized.
  assert.equal(
    missingKey.capture('catalog_query_intent', { result_count: 1 }),
    undefined,
  );
  assert.equal(requests.length, sentCount);
});
