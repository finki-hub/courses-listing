import type { PostHog } from 'posthog-js';

type AnalyticsClient = Pick<PostHog, 'capture'>;
type AnalyticsProperties = Record<string, unknown>;
type QueuedEvent = { event: string; properties?: AnalyticsProperties };
type Schedule = (run: () => void) => void;

// Events sent before the SDK finishes loading wait here. The cap bounds memory
// if loading stalls; the startup window only produces a handful of events.
const MAX_QUEUED_EVENTS = 50;
const IDLE_TIMEOUT_MS = 2_000;

const state: {
  client: AnalyticsClient | undefined;
  pending: boolean;
  queue: QueuedEvent[];
} = { client: undefined, pending: false, queue: [] };

// Load after the first render settles, so the SDK never delays the page.
const scheduleIdle: Schedule = (run) => {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    return;
  }

  setTimeout(run, 1);
};

// Queues events until the SDK is ready. Without a started client (analytics
// disabled, or loading failed) events are dropped, like the uninitialized SDK.
export const capture = (
  event: string,
  properties?: AnalyticsProperties,
): void => {
  if (state.client) {
    state.client.capture(event, properties);
    return;
  }

  if (state.pending && state.queue.length < MAX_QUEUED_EVENTS) {
    state.queue.push({ event, properties });
  }
};

const flush = (client: AnalyticsClient): void => {
  state.client = client;
  state.pending = false;
  for (const { event, properties } of state.queue.splice(0)) {
    client.capture(event, properties);
  }
};

const discard = (): void => {
  state.pending = false;
  state.queue.length = 0;
};

export const startAnalytics = async (
  load: () => Promise<AnalyticsClient>,
  schedule: Schedule = scheduleIdle,
): Promise<void> => {
  if (state.pending || state.client) return;
  state.pending = true;

  await new Promise<void>((resolve) => {
    schedule(resolve);
  });

  try {
    flush(await load());
  } catch {
    discard();
  }
};
