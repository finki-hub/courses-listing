import { createEffect, createMemo, untrack } from 'solid-js';

import type { SortColumn, SortDirection } from '@/lib/course-filters';
import type {
  Accreditation,
  CourseLevelFilter,
  SeasonFilter,
} from '@/types/course';

import { capture } from '../lib/analytics-client.ts';

type SearchContext = {
  accreditation: Accreditation | null;
  level: CourseLevelFilter;
  /** Any further filters, serialized; only compared locally, never sent. */
  otherFilters?: string;
  query: string;
  resultCount: number;
  season: SeasonFilter;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  tags: ReadonlySet<string>;
};

const TAG_COLLATOR = new Intl.Collator();

export const useCourseSearchAnalytics = (
  getContext: () => SearchContext,
): (() => { search_attempt_id?: string }) => {
  // Local equality only: neither tag values nor this key are sent to analytics.
  const state = createMemo(() => {
    const context = getContext();
    return JSON.stringify({
      ...context,
      tags: [...context.tags].sort((a, b) => TAG_COLLATOR.compare(a, b)),
    });
  });
  let attempt: undefined | { id: string; state: string };
  let settled: undefined | { id: string; query: string; state: string };

  createEffect(
    () => state(),
    (currentState) => {
      const { query, resultCount } = untrack(getContext);
      attempt = undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      if (query === '') {
        settled = undefined;
      } else {
        timer = setTimeout(() => {
          // A canceled edit returning to the settled state is not another attempt.
          // Its clicks remain unlinked until this debounce has finished.
          if (settled?.state === currentState) {
            attempt = settled;
            return;
          }
          // Refinement also includes result-count updates, not only user actions.
          const event =
            settled?.query === query
              ? 'catalog_refinement'
              : 'catalog_query_intent';
          const id = crypto.randomUUID();
          attempt = { id, state: currentState };
          settled = { ...attempt, query };
          // eslint-disable-next-line camelcase -- PostHog event props are snake_case
          const linkage = { search_attempt_id: id };
          capture(event, {
            ...linkage,
            // eslint-disable-next-line camelcase -- PostHog event props are snake_case
            result_count: resultCount,
          });
          if (resultCount === 0) {
            capture('search_zero_results', linkage);
          }
        }, 500);
      }
      return () => {
        if (timer !== undefined) clearTimeout(timer);
        attempt = undefined;
      };
    },
  );

  // A click during debounce is deliberately unlinked, never linked to history.
  return () =>
    attempt?.state === state()
      ? // eslint-disable-next-line camelcase -- PostHog event props are snake_case
        { search_attempt_id: attempt.id }
      : {};
};
