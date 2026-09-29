/* eslint-disable camelcase -- Assert the SDK's configuration and wire fields. */
import assert from 'node:assert/strict';
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

test('allowlist rebuilds both payload levels and preserves only event-specific fields', () => {
  for (const [name, business] of [
    ['catalog_search', { query: 'alpha', result_count: 2 }],
    ['search_zero_results', { query: 'alpha' }],
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
        app_revision: PRIVATE,
        distinct_id: ID,
        search_attempt_id: ID,
        service: PRIVATE,
        sim: PRIVATE,
        token: PRIVATE,
        utm_source: PRIVATE,
      },
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
      event: 'catalog_search',
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
    service: 'courses-listing',
    token: TOKEN,
  });
  assert.equal(sanitizeAnalyticsEvent(null, TOKEN, REVISION), null);
  for (const event of [
    '$autocapture',
    '$pageview',
    '$pageleave',
    '$exception',
    '$snapshot',
    '$identify',
    '$feature_flag_called',
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
  // Raw search strings deliberately remain raw, even if a user types a URL.
  assert.equal(
    sanitizeAnalyticsEvent(
      { event: 'catalog_search', properties: { query: PRIVATE_URL }, uuid: ID },
      TOKEN,
      REVISION,
    ).properties.query,
    PRIVATE_URL,
  );
});

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
    ['catalog_search', { query: 'alpha', result_count: 2 }],
    ['search_zero_results', { query: 'none' }],
    ['result_clicked', { position: 0, result_id: 'Public course' }],
  ]) {
    const result = sdk.capture(
      event,
      {
        ...business,
        $set: { nested: PRIVATE_URL },
        app_revision: 'spoof',
        search_attempt_id: ID,
      },
      { $set: { nested: PRIVATE_URL }, $set_once: { nested: PRIVATE_URL } },
    );
    assert.equal(result.properties.app_revision, REVISION);
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
  assert.equal(requests.length, 3);
  for (const { body, url } of requests) {
    assert.equal(url, 'https://ingest.example/e/');
    assert.equal(typeof body, 'string');
    assert.equal(body.includes(PRIVATE), false);
    const payload = JSON.parse(body);
    assert.equal(payload.api_key, TOKEN);
    assert.equal(payload.batch.length, 1);
    assert.equal(payload.batch[0].properties.app_revision, REVISION);
  }
  sdk.opt_out_capturing();
  assert.equal(sdk.has_opted_out_capturing(), true);
  assert.equal(
    sdk.capture('catalog_search', { query: 'after opt-out', result_count: 1 }),
    undefined,
  );
  assert.equal(requests.length, 3);
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
  assert.equal(requests.length, 3);
  const missingKey = new PostHog();
  // The app's empty-key guard leaves the SDK uninitialized.
  assert.equal(
    missingKey.capture('catalog_search', { query: 'no key' }),
    undefined,
  );
  assert.equal(requests.length, 3);
});
