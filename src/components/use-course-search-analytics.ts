import { posthog } from 'posthog-js';
import { createEffect, onCleanup } from 'solid-js';

import { type CourseRaw } from '@/types/course';

export const useCourseSearchAnalytics = (
  getSearch: () => string,
  getFilteredCourses: () => CourseRaw[],
): void => {
  createEffect(() => {
    const query = getSearch();
    const timer = setTimeout(() => {
      if (query === '') return;
      const count = getFilteredCourses().length;
      // eslint-disable-next-line camelcase -- PostHog event props are snake_case
      posthog.capture('catalog_search', { query, result_count: count });
      if (count === 0) posthog.capture('search_zero_results', { query });
    }, 500);
    onCleanup(() => {
      clearTimeout(timer);
    });
  });
};
