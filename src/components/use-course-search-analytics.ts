import { posthog } from 'posthog-js';
import { createEffect, createMemo, onCleanup, untrack } from 'solid-js';

import type { SortColumn, SortDirection } from '@/lib/course-filters';
import type {
  Accreditation,
  CourseLevelFilter,
  SeasonFilter,
} from '@/types/course';

type SearchContext = {
  accreditation: Accreditation | null;
  level: CourseLevelFilter;
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

  createEffect(() => {
    const currentState = state();
    const { query, resultCount } = untrack(getContext);
    attempt = undefined;
    if (query === '') return;

    const timer = setTimeout(() => {
      const id = crypto.randomUUID();
      attempt = { id, state: currentState };
      // eslint-disable-next-line camelcase -- PostHog event props are snake_case
      const linkage = { search_attempt_id: id };
      posthog.capture('catalog_search', {
        ...linkage,
        query,
        // eslint-disable-next-line camelcase -- PostHog event props are snake_case
        result_count: resultCount,
      });
      if (resultCount === 0) {
        posthog.capture('search_zero_results', { ...linkage, query });
      }
    }, 500);
    onCleanup(() => {
      clearTimeout(timer);
      attempt = undefined;
    });
  });

  // A click during debounce is deliberately unlinked, never linked to history.
  return () => {
    if (attempt?.state !== state()) return {};
    // eslint-disable-next-line camelcase -- PostHog event props are snake_case
    return { search_attempt_id: attempt.id };
  };
};
