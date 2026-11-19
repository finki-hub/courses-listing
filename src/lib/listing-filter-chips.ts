import {
  DEFAULT_LISTING_FILTERS,
  type ListingFilters,
} from '@/lib/listing-url-state';

// One active filter, shown as a removable chip. Flags carry no value.
export type FilterChip = {
  readonly kind: FilterChipKind;
  readonly value: string;
};

export type FilterChipKind =
  | 'accreditation'
  | 'channel'
  | 'credits'
  | 'inactive'
  | 'level'
  | 'offered'
  | 'program'
  | 'query'
  | 'season'
  | 'semester'
  | 'staff'
  | 'tag';

// Filters the master's view doesn't have.
const UNDERGRADUATE_ONLY: ReadonlySet<FilterChipKind> = new Set([
  'accreditation',
  'level',
  'semester',
  'tag',
]);

const getAllFilterChips = (filters: ListingFilters): FilterChip[] => {
  type ChipSource = [
    Exclude<FilterChipKind, 'tag'>,
    boolean | null | number | string,
  ];
  const sources: ChipSource[] = [
    ['query', filters.query.trim()],
    ['accreditation', filters.accreditation],
    ['season', filters.season],
    ['level', filters.level],
    ['semester', filters.semester],
    ['credits', filters.credits],
    ['program', filters.program],
    ['staff', filters.staff],
    ['inactive', filters.hideInactive],
    ['offered', filters.offeredOnly],
    ['channel', filters.channelOnly],
  ];
  return [
    ...sources
      .filter(([, value]) => value !== null && value !== '' && value !== false)
      .map(([kind, value]) => ({
        kind,
        value: value === true ? '' : String(value),
      })),
    ...filters.tags.map((tag) => ({ kind: 'tag' as const, value: tag })),
  ];
};

export const getFilterChips = (filters: ListingFilters): FilterChip[] =>
  getAllFilterChips(filters).filter(
    (chip) => filters.cycle !== 'master' || !UNDERGRADUATE_ONLY.has(chip.kind),
  );

const CHIP_RESETS: Record<
  Exclude<FilterChipKind, 'tag'>,
  Partial<ListingFilters>
> = {
  accreditation: { accreditation: null },
  channel: { channelOnly: false },
  credits: { credits: null },
  inactive: { hideInactive: false },
  level: { level: null },
  offered: { offeredOnly: false },
  program: { program: null, programState: null },
  query: { query: '' },
  season: { season: null },
  semester: { semester: null },
  staff: { staff: '' },
};

export const removeFilterChip = (
  filters: ListingFilters,
  chip: FilterChip,
): ListingFilters =>
  chip.kind === 'tag'
    ? { ...filters, tags: filters.tags.filter((tag) => tag !== chip.value) }
    : { ...filters, ...CHIP_RESETS[chip.kind] };

// Clears every filter and the search, keeping the cycle and how tags combine.
export const clearFilters = (filters: ListingFilters): ListingFilters => ({
  ...DEFAULT_LISTING_FILTERS,
  cycle: filters.cycle,
  tagMode: filters.tagMode,
});

// The groups the filter panel is organized in.
export type FilterSection =
  'curriculum' | 'people' | 'program' | 'status' | 'topics';

const CHIP_SECTIONS: Record<FilterChipKind, FilterSection | null> = {
  accreditation: 'curriculum',
  channel: 'status',
  credits: 'curriculum',
  inactive: 'status',
  level: 'curriculum',
  offered: 'status',
  program: 'program',
  query: null,
  season: 'curriculum',
  semester: 'curriculum',
  staff: 'people',
  tag: 'topics',
};

// The panel sections that hold an active filter, so they start expanded.
export const getActiveFilterSections = (
  filters: ListingFilters,
): Set<FilterSection> =>
  new Set(
    getFilterChips(filters)
      .map((chip) => CHIP_SECTIONS[chip.kind])
      .filter((section): section is FilterSection => section !== null),
  );

// Active filters other than the search, as counted on the Filters button.
export const countActiveFilters = (filters: ListingFilters): number =>
  getFilterChips(filters).filter((chip) => chip.kind !== 'query').length;
