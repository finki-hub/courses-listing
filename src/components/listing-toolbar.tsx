import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  SlidersHorizontal,
} from 'lucide-solid';
import { Show } from 'solid-js';

import { stackedLabel } from '@/components/listing-filter-panel';
import { IconButton } from '@/components/ui/icon-controls';
import { SearchInput } from '@/components/ui/search-input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { type SortColumn, type SortDirection } from '@/lib/course-filters';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type StudyCycle } from '@/lib/listing-url-state';

const SORT_LABEL_KEYS = {
  accreditation: 'accreditation',
  channel: 'channel',
  credits: 'credits',
  name: 'course',
  popularity: 'popularity',
  semester: 'semester',
  tags: 'tags',
} as const;

type ListingToolbarProps = {
  readonly activeFilters: number;
  readonly cycle: StudyCycle;
  readonly onOpenFilters: () => void;
  readonly onSearch: (query: string) => void;
  readonly onSwitchCycle: (cycle: StudyCycle) => void;
  readonly onToggleSort: (column: SortColumn) => void;
  readonly query: string;
  /** Sorting applies to the results; hidden where they aren't sorted. */
  readonly showSort?: boolean;
  readonly sortColumn: SortColumn;
  readonly sortColumns: readonly SortColumn[];
  readonly sortDirection: SortDirection;
};

// What every visit uses: which studies, the search and the order. Filters
// live in the sidebar, or behind the Filters button below the desktop width.
export const ListingToolbar = (props: ListingToolbarProps) => {
  const { t } = useLanguage();

  const directionLabel = () =>
    interpolate(t().listing.sortDirection, {
      direction:
        props.sortDirection === 'asc'
          ? t().listing.sortAscending
          : t().listing.sortDescending,
    });

  return (
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <SegmentedControl
          aria-label={stackedLabel(t().masters.cycle)}
          class="w-full shrink-0 sm:w-auto"
          items={[
            {
              label: t().masters.undergraduate,
              value: 'undergraduate' as const,
            },
            { label: t().masters.master, value: 'master' as const },
          ]}
          onSelect={props.onSwitchCycle}
          value={props.cycle}
        />
        <div class="min-w-0 flex-1">
          <SearchInput
            aria-label={t().common.searchCourses}
            onInput={(event) => {
              props.onSearch(event.currentTarget.value);
            }}
            placeholder={t().listing.searchPlaceholder}
            value={props.query}
          />
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          class="bg-card hover:bg-muted focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
          onClick={() => {
            props.onOpenFilters();
          }}
          type="button"
        >
          <SlidersHorizontal
            aria-hidden="true"
            class="h-4 w-4"
          />
          {t().filters.panelTitle}
          <span class="sr-only">
            ,{' '}
            {interpolate(t().filters.activeCount, {
              count: props.activeFilters,
            })}
          </span>
          <Show when={props.activeFilters > 0}>
            <span
              aria-hidden="true"
              class="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums"
            >
              {props.activeFilters}
            </span>
          </Show>
        </button>

        <Show when={props.showSort ?? true}>
          <div class="ml-auto flex items-center gap-2">
            <label
              class="text-muted-foreground sr-only text-sm sm:not-sr-only lg:sr-only xl:not-sr-only"
              for="listing-sort"
            >
              {t().listing.sortBy}
            </label>
            <Select
              class="w-40 sm:w-44"
              id="listing-sort"
              onChange={(value) => {
                const column = props.sortColumns.find((item) => item === value);
                if (column && column !== props.sortColumn)
                  props.onToggleSort(column);
              }}
              options={props.sortColumns.map((column) => ({
                label: t().common[SORT_LABEL_KEYS[column]],
                value: column,
              }))}
              value={props.sortColumn}
            />
            <IconButton
              aria-label={directionLabel()}
              onClick={() => {
                props.onToggleSort(props.sortColumn);
              }}
              title={directionLabel()}
              type="button"
            >
              <Show
                fallback={
                  <ArrowDownWideNarrow
                    aria-hidden="true"
                    class="h-4 w-4"
                  />
                }
                when={props.sortDirection === 'asc'}
              >
                <ArrowUpNarrowWide
                  aria-hidden="true"
                  class="h-4 w-4"
                />
              </Show>
            </IconButton>
          </div>
        </Show>
      </div>
    </div>
  );
};
