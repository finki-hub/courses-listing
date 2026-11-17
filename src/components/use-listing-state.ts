import { createEffect, createSignal, on, onCleanup } from 'solid-js';

import { getListingPrograms } from '@/lib/course-facts';
import {
  getDefaultSortDirection,
  SORT_COLUMNS,
  type SortColumn,
  type SortDirection,
} from '@/lib/course-filters';
import {
  type ListingFilters,
  parseListingUrlState,
  replaceUrlParams,
  writeListingUrlState,
} from '@/lib/listing-url-state';
import { type Accreditation, ALL_TAGS } from '@/types/course';

const SEARCH_URL_DELAY_MS = 300;

// Listing filters and sort, restored from and mirrored to the URL.
export const useListingState = () => {
  const {
    sortColumn: initialSortColumn,
    sortDirection: initialDirection,
    ...parsedFilters
  } = parseListingUrlState(new URL(location.href).searchParams, {
    programs: getListingPrograms(null),
    sortColumns: SORT_COLUMNS,
    tags: ALL_TAGS,
  });
  // A linked program must belong to the linked accreditation.
  const initialFilters: ListingFilters =
    parsedFilters.program === null ||
    getListingPrograms(parsedFilters.accreditation).includes(
      parsedFilters.program,
    )
      ? parsedFilters
      : { ...parsedFilters, program: null, programState: null };
  const [filters, setFilters] = createSignal<ListingFilters>(initialFilters);
  const [sortColumn, setSortColumn] =
    createSignal<SortColumn>(initialSortColumn);
  const [sortDirection, setSortDirection] =
    createSignal<SortDirection>(initialDirection);

  const updateFilters = (patch: Partial<ListingFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };
  const search = () => filters().query;

  // Typing updates the URL once it pauses, not on every keystroke.
  const [urlQuery, setUrlQuery] = createSignal(initialFilters.query);
  createEffect(
    on(
      search,
      (query) => {
        const timer = setTimeout(setUrlQuery, SEARCH_URL_DELAY_MS, query);
        onCleanup(() => {
          clearTimeout(timer);
        });
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    const state = {
      ...filters(),
      query: urlQuery(),
      sortColumn: sortColumn(),
      sortDirection: sortDirection(),
    };
    replaceUrlParams((params) => {
      writeListingUrlState(params, state, { tags: ALL_TAGS });
    });
  });

  const toggleTag = (tag: string) => {
    const current = filters().tags;
    updateFilters({
      tags: current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    });
  };

  const toggleSort = (column: SortColumn) => {
    if (sortColumn() === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(getDefaultSortDirection(column));
    }
  };

  // A program missing from the chosen accreditation would match nothing.
  const switchAccreditation = (value: Accreditation) => {
    const accreditation = filters().accreditation === value ? null : value;
    const program = filters().program;
    const keepsProgram =
      program === null || getListingPrograms(accreditation).includes(program);
    updateFilters({
      accreditation,
      ...(!keepsProgram && { program: null, programState: null }),
    });
  };

  return {
    filters,
    search,
    setFilters,
    setSearch: (query: string) => {
      updateFilters({ query });
    },
    sortColumn,
    sortDirection,
    switchAccreditation,
    toggleSort,
    toggleTag,
    updateFilters,
  };
};
