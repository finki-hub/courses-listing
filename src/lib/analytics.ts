import { posthog } from 'posthog-js';

import { withAppRevision } from './analytics-revision';

const DEFAULT_HOST = 'https://eu.i.posthog.com';

const readEnv = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const initAnalytics = (): void => {
  const key = readEnv(import.meta.env['VITE_POSTHOG_KEY']);

  if (key === '') return;

  const host = readEnv(import.meta.env['VITE_POSTHOG_HOST']);

  posthog.init(key, {
    // eslint-disable-next-line camelcase -- PostHog config keys are snake_case
    api_host: host === '' ? DEFAULT_HOST : host,
    autocapture: true,
    // eslint-disable-next-line camelcase -- PostHog config keys are snake_case
    before_send: (event) => {
      if (event) {
        event.properties = withAppRevision(
          event.properties,
          import.meta.env['VITE_APP_REVISION'],
        );
      }
      return event;
    },
    // eslint-disable-next-line camelcase -- PostHog config keys are snake_case
    capture_exceptions: true,
    // eslint-disable-next-line camelcase -- PostHog config keys are snake_case
    capture_pageview: 'history_change',
    // eslint-disable-next-line camelcase -- PostHog config keys are snake_case
    person_profiles: 'identified_only',
  });
  posthog.register({ service: 'courses-listing' });
};
