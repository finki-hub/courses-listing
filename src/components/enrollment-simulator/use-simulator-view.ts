import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
} from 'solid-js';

import { replaceUrlParams } from '@/lib/listing-url-state';
import { type SimulatorCourse } from '@/lib/simulator';
import {
  type SimulatorMode,
  type SimulatorUrlState,
  writeSimulatorUrlState,
} from '@/lib/simulator-url-state';
import {
  type CourseTypeFilter,
  filterSimulatorCourses,
  groupBySemester,
} from '@/lib/simulator-view';
import { type CourseLevelFilter, type SeasonFilter } from '@/types/course';

type SimulatorViewParams = {
  courses: Accessor<SimulatorCourse[]>;
  enabledMap: Accessor<Record<string, boolean>>;
  initial: Pick<SimulatorUrlState, 'search' | 'tags' | 'type'>;
  levelFilter: Accessor<CourseLevelFilter>;
  mode: Accessor<SimulatorMode>;
  seasonFilter: Accessor<SeasonFilter>;
  showOnlyEnabled: Accessor<boolean>;
};

// Search, course-type and tag filters, and the semester groups they produce.
export const useSimulatorView = (params: SimulatorViewParams) => {
  const [search, setSearch] = createSignal(params.initial.search);
  const [typeFilter, setTypeFilter] = createSignal<CourseTypeFilter>(
    params.initial.type,
  );
  const [tagFilter, setTagFilter] = createSignal<ReadonlySet<string>>(
    new Set(params.initial.tags),
  );

  const toggleTag = (tag: string) => {
    const next = new Set(tagFilter());
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setTagFilter(next);
  };

  const groups = createMemo(() =>
    groupBySemester(
      filterSimulatorCourses(params.courses(), {
        enabledMap: params.enabledMap(),
        level: params.levelFilter(),
        search: search(),
        season: params.seasonFilter(),
        showOnlyEnabled: params.showOnlyEnabled(),
        tags: tagFilter(),
        type: typeFilter(),
      }),
    ),
  );

  // The view and its filters live in the URL, so a reload keeps them.
  createEffect(() => {
    const state: SimulatorUrlState = {
      level: params.levelFilter(),
      mode: params.mode(),
      search: search(),
      season: params.seasonFilter(),
      showOnlyEnabled: params.showOnlyEnabled(),
      tags: [...tagFilter()],
      type: typeFilter(),
    };
    replaceUrlParams((urlParams) => {
      writeSimulatorUrlState(urlParams, state);
    });
  });

  // Filters that only narrow the checklist and the plan, not "What next".
  const listFilterCount = () =>
    (search().trim() === '' ? 0 : 1) +
    (typeFilter() === 'all' ? 0 : 1) +
    tagFilter().size;
  const clearListFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setTagFilter(new Set<string>());
  };

  return {
    clearListFilters,
    groups,
    listFilterCount,
    search,
    setSearch,
    setTypeFilter,
    tagFilter,
    toggleTag,
    typeFilter,
  };
};
