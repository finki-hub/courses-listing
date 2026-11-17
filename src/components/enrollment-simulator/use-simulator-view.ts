import { type Accessor, createMemo, createSignal } from 'solid-js';

import { type SimulatorCourse } from '@/lib/simulator';
import {
  type CourseTypeFilter,
  filterSimulatorCourses,
  groupBySemester,
} from '@/lib/simulator-view';
import { type CourseLevelFilter, type SeasonFilter } from '@/types/course';

type SimulatorViewParams = {
  courses: Accessor<SimulatorCourse[]>;
  enabledMap: Accessor<Record<string, boolean>>;
  levelFilter: Accessor<CourseLevelFilter>;
  seasonFilter: Accessor<SeasonFilter>;
  showOnlyEnabled: Accessor<boolean>;
};

// Search, course-type and tag filters, and the semester groups they produce.
export const useSimulatorView = (params: SimulatorViewParams) => {
  const [search, setSearch] = createSignal('');
  const [typeFilter, setTypeFilter] = createSignal<CourseTypeFilter>('all');
  const [tagFilter, setTagFilter] = createSignal<ReadonlySet<string>>(
    new Set(),
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

  // Hidden filters, counted on the disclosure button.
  const activeFilterCount = () =>
    (typeFilter() === 'all' ? 0 : 1) +
    tagFilter().size +
    (params.showOnlyEnabled() ? 1 : 0);

  return {
    activeFilterCount,
    groups,
    search,
    setSearch,
    setTypeFilter,
    tagFilter,
    toggleTag,
    typeFilter,
  };
};
