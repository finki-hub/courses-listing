import { createEffect, createSignal } from 'solid-js';

import {
  SORT_COLUMNS,
  type SortColumn,
  type SortDirection,
} from '@/lib/course-filters';
import {
  parseListingUrlState,
  replaceUrlParams,
  writeListingUrlState,
} from '@/lib/listing-url-state';
import {
  type Accreditation,
  ALL_TAGS,
  type CourseLevelFilter,
  type SeasonFilter,
} from '@/types/course';

// Listing filters and sort, restored from and mirrored to the URL.
export const useListingState = () => {
  const initialState = parseListingUrlState(
    new URL(location.href).searchParams,
    {
      sortColumns: SORT_COLUMNS,
      tags: ALL_TAGS,
    },
  );
  const [search, setSearch] = createSignal(initialState.query);
  const [accreditation, setAccreditation] = createSignal<Accreditation | null>(
    initialState.accreditation,
  );
  const [seasonFilter, setSeasonFilter] = createSignal<SeasonFilter>(
    initialState.season,
  );
  const [levelFilter, setLevelFilter] = createSignal<CourseLevelFilter>(
    initialState.level,
  );
  const [sortColumn, setSortColumn] = createSignal<SortColumn>(
    initialState.sortColumn,
  );
  const [sortDirection, setSortDirection] = createSignal<SortDirection>(
    initialState.sortDirection,
  );
  const [selectedTags, setSelectedTags] = createSignal(
    new Set<string>(initialState.tags),
  );

  createEffect(() => {
    const state = {
      accreditation: accreditation(),
      level: levelFilter(),
      query: search(),
      season: seasonFilter(),
      sortColumn: sortColumn(),
      sortDirection: sortDirection(),
      tags: [...selectedTags()],
    };
    replaceUrlParams((params) => {
      writeListingUrlState(params, state, { tags: ALL_TAGS });
    });
  });

  const toggleTag = (tag: string) => {
    const current = new Set(selectedTags());
    current[current.has(tag) ? 'delete' : 'add'](tag);
    setSelectedTags(current);
  };

  const toggleSort = (column: SortColumn) => {
    if (sortColumn() === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const switchAccreditation = (value: Accreditation) => {
    setAccreditation((current) => (current === value ? null : value));
  };

  return {
    accreditation,
    levelFilter,
    search,
    seasonFilter,
    selectedTags,
    setLevelFilter,
    setSearch,
    setSeasonFilter,
    sortColumn,
    sortDirection,
    switchAccreditation,
    toggleSort,
    toggleTag,
  };
};
