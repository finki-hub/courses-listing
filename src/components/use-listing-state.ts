import { createEffect, createSignal, on, onCleanup } from 'solid-js';

import { getListingPrograms } from '@/lib/course-facts';
import {
  getDefaultSortDirection,
  MASTER_SORT_COLUMNS,
  SORT_COLUMNS,
  type SortColumn,
  type SortDirection,
} from '@/lib/course-filters';
import {
  DEFAULT_LISTING_FILTERS,
  type ListingFilters,
  parseListingUrlState,
  replaceUrlParams,
  type StudyCycle,
  writeListingUrlState,
} from '@/lib/listing-url-state';
import { type Accreditation, ALL_TAGS } from '@/types/course';

const SEARCH_URL_DELAY_MS = 300;

const sanitizeLinkedFilters = (filters: ListingFilters): ListingFilters => {
  if (filters.cycle === 'master') {
    return {
      ...filters,
      accreditation: null,
      level: null,
      semester: null,
      tags: [],
    };
  }
  const keepsProgram =
    filters.program === null ||
    getListingPrograms(filters.accreditation).includes(filters.program);
  return keepsProgram
    ? filters
    : { ...filters, program: null, programState: null };
};

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
  // A linked program must belong to the linked accreditation. Master's
  // programs are checked once their data has loaded, and master's courses
  // have no accreditations, levels, semesters or tags to filter by.
  const initialFilters = sanitizeLinkedFilters(parsedFilters);
  const [filters, setFilters] = createSignal<ListingFilters>(initialFilters);
  const sortColumnsFor = (cycle: StudyCycle): readonly SortColumn[] =>
    cycle === 'master' ? MASTER_SORT_COLUMNS : SORT_COLUMNS;
  const [sortColumn, setSortColumn] = createSignal<SortColumn>(
    sortColumnsFor(initialFilters.cycle).includes(initialSortColumn)
      ? initialSortColumn
      : 'name',
  );
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

  // The other cycle has its own filters: start it from a clean slate,
  // keeping the search and how tags combine.
  const keepSortValid = (cycle: StudyCycle) => {
    if (sortColumnsFor(cycle).includes(sortColumn())) return;
    setSortColumn('name');
    setSortDirection('asc');
  };

  const switchCycle = (cycle: StudyCycle) => {
    if (filters().cycle === cycle) return;
    setFilters((current) => ({
      ...DEFAULT_LISTING_FILTERS,
      cycle,
      query: current.query,
      savedOnly: current.savedOnly,
      tagMode: current.tagMode,
    }));
    keepSortValid(cycle);
  };

  // A course link can switch the view: keep only the linked filters that
  // apply to the other cycle, as for a link that names the cycle itself.
  // A program belongs to one cycle, so it never carries over.
  const showLinkedCycle = (cycle: StudyCycle) => {
    if (filters().cycle === cycle) return;
    setFilters((current) =>
      sanitizeLinkedFilters({
        ...current,
        cycle,
        program: null,
        programState: null,
      }),
    );
    keepSortValid(cycle);
  };

  return {
    filters,
    search,
    setFilters,
    setSearch: (query: string) => {
      updateFilters({ query });
    },
    showLinkedCycle,
    sortColumn,
    sortDirection,
    switchAccreditation,
    switchCycle,
    toggleSort,
    toggleTag,
    updateFilters,
  };
};
