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

export const getFilterChips = (filters: ListingFilters): FilterChip[] => {
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

// Clears every filter and the search, keeping how tags combine.
export const clearFilters = (filters: ListingFilters): ListingFilters => ({
  ...DEFAULT_LISTING_FILTERS,
  tagMode: filters.tagMode,
});

// Whether a filter behind the "More filters" disclosure is in use.
export const hasMoreFilters = (filters: ListingFilters): boolean =>
  filters.program !== null ||
  filters.semester !== null ||
  filters.credits !== null ||
  filters.staff !== '' ||
  filters.hideInactive ||
  filters.offeredOnly ||
  filters.channelOnly;
