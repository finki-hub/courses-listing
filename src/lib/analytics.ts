import { posthog } from 'posthog-js';

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
    capture_exceptions: true,
    // eslint-disable-next-line camelcase -- PostHog config keys are snake_case
    capture_pageview: 'history_change',
    // eslint-disable-next-line camelcase -- PostHog config keys are snake_case
    person_profiles: 'identified_only',
  });
};
