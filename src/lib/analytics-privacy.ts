/* eslint-disable camelcase -- PostHog's configuration and wire fields use snake_case. */
import type { CaptureResult, PostHogConfig } from 'posthog-js';

import { withAppRevision } from './analytics-revision.ts';

const UUID_PATTERN = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/u;
const ID_FIELDS = [
  'distinct_id',
  '$device_id',
  '$session_id',
  '$window_id',
  'search_attempt_id',
];

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const EVENT_FIELDS: Record<
  string,
  Record<string, (value: unknown) => boolean>
> = {
  catalog_query_intent: { result_count: isCount },
  catalog_refinement: { result_count: isCount },
  result_clicked: { position: isCount, result_id: isString },
  search_zero_results: {},
};

// Rebuild both levels rather than recursively redacting an open-ended SDK payload.
// In particular, top-level $set/$set_once can bypass property-only sanitization.
export const sanitizeAnalyticsEvent = (
  event: CaptureResult | null,
  token: string,
  revision: unknown,
): CaptureResult | null => {
  if (!event || !isUuid(event.uuid)) return null;
  const fields = Object.hasOwn(EVENT_FIELDS, event.event)
    ? EVENT_FIELDS[event.event]
    : undefined;
  if (!fields) return null;
  const { properties: input } = event;
  const properties: Record<string, unknown> = {
    $lib: 'web',
    $process_person_profile: false,
    analytics_schema_version: 2,
    service: 'courses-listing',
    token,
  };

  for (const [field, validate] of Object.entries(fields)) {
    if (validate(input[field])) properties[field] = input[field];
  }

  for (const field of ID_FIELDS) {
    if (isUuid(input[field])) properties[field] = input[field];
  }
  if (
    typeof input['$lib_version'] === 'string' &&
    VERSION_PATTERN.test(input['$lib_version'])
  ) {
    properties['$lib_version'] = input['$lib_version'];
  }

  return {
    event: event.event,
    properties: withAppRevision(properties, revision),
    ...(event.timestamp instanceof Date &&
      Number.isFinite(event.timestamp.getTime()) && {
        timestamp: event.timestamp,
      }),
    uuid: event.uuid,
  };
};

export const createAnalyticsConfig = (
  token: string,
  host: string,
  revision: unknown,
): Partial<PostHogConfig> => ({
  advanced_disable_flags: true,
  api_host: host,
  autocapture: false,
  before_send: (event) => sanitizeAnalyticsEvent(event, token, revision),
  capture_exceptions: false,
  capture_heatmaps: false,
  capture_pageleave: false,
  capture_pageview: false,
  capture_performance: false,
  disable_capture_url_hashes: true,
  disable_conversations: true,
  disable_external_dependency_loading: true,
  disable_product_tours: true,
  disable_scroll_properties: true,
  disable_session_recording: true,
  disable_surveys: true,
  disableDeviceModel: true,
  // These transports do not use event before_send.
  logs: { beforeSend: () => null, captureConsoleLogs: false },
  metrics: { beforeSend: () => null, network: false },
  person_profiles: 'never',
  rageclick: false,
  save_campaign_params: false,
  save_referrer: false,
});
