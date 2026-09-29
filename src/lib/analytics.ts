import { posthog } from 'posthog-js';

import { createAnalyticsConfig } from './analytics-privacy';

const DEFAULT_HOST = 'https://eu.i.posthog.com';

const readEnv = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const initAnalytics = (): void => {
  const key = readEnv(import.meta.env['VITE_POSTHOG_KEY']);

  if (key === '') return;

  const host = readEnv(import.meta.env['VITE_POSTHOG_HOST']);

  posthog.init(
    key,
    createAnalyticsConfig(
      key,
      host === '' ? DEFAULT_HOST : host,
      import.meta.env['VITE_APP_REVISION'],
    ),
  );
  posthog.register({ service: 'courses-listing' });
};
