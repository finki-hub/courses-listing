import { createUniqueId, For, Show } from 'solid-js';

import { ActiveFilterChips } from '@/components/active-filter-chips';
import { CourseFilterRow } from '@/components/course-filter-row';
import { FilterGroup } from '@/components/filter-group';
import { ListingMoreFilters } from '@/components/listing-more-filters';
import { TagChips } from '@/components/tag-chips';
import { SearchInput } from '@/components/ui/search-input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ALERT_STYLES } from '@/lib/alert-styles';
import { type SortColumn, type SortDirection } from '@/lib/course-filters';
import { useLanguage } from '@/lib/LanguageProvider';
import { type FilterChip } from '@/lib/listing-filter-chips';
import { type ListingFilters, type StudyCycle } from '@/lib/listing-url-state';
import { type Accreditation } from '@/types/course';

// The master's view: its programs, once loaded.
export type MasterControls = {
  readonly error: boolean;
  readonly loading: boolean;
  readonly programLabel: (program: string) => string;
  readonly programOptions: ReadonlyArray<{ label: string; value: string }>;
};

type CourseListingControlsProps = {
  readonly credits: readonly number[];
  readonly filters: ListingFilters;
  readonly master?: MasterControls;
  readonly moreExpanded: boolean;
  readonly onClearFilters: () => void;
  readonly onMoreExpandedChange: (expanded: boolean) => void;
  readonly onRemoveChip: (chip: FilterChip) => void;
  readonly onSwitchAccreditation: (accreditation: Accreditation) => void;
  readonly onSwitchCycle: (cycle: StudyCycle) => void;
  readonly onToggleSort: (column: SortColumn) => void;
  readonly onToggleTag: (tag: string) => void;
  readonly onUpdate: (patch: Partial<ListingFilters>) => void;
  readonly resultCount: number;
  readonly sortColumn: SortColumn;
  readonly sortColumns: readonly SortColumn[];
  readonly sortDirection: SortDirection;
  readonly staff: readonly string[];
};

const SORT_LABEL_KEYS = {
  accreditation: 'accreditation',
  channel: 'channel',
  credits: 'credits',
  name: 'course',
  popularity: 'popularity',
  semester: 'semester',
  tags: 'tags',
} as const;

export const CourseListingControls = (props: CourseListingControlsProps) => {
  const { t } = useLanguage();
  const tagsLabelId = createUniqueId();
  const tagModeItems = () =>
    [
      { label: t().filters.tagModeAny, value: 'any' },
      { label: t().filters.tagModeAll, value: 'all' },
    ] as const;

  const cycleItems = () =>
    [
      { label: t().masters.undergraduate, value: 'undergraduate' },
      { label: t().masters.master, value: 'master' },
    ] as const;

  return (
    <>
      <FilterGroup label={t().masters.cycle}>
        <SegmentedControl
          class="w-full sm:w-auto"
          items={cycleItems()}
          onSelect={props.onSwitchCycle}
          value={props.filters.cycle}
        />
      </FilterGroup>

      <SearchInput
        aria-label={t().common.searchCourses}
        onInput={(event) => {
          props.onUpdate({ query: event.currentTarget.value });
        }}
        placeholder={t().listing.searchPlaceholder}
        value={props.filters.query}
      />

      <CourseFilterRow
        accreditation={props.filters.accreditation}
        clearableAccreditation
        levelFilter={props.filters.level}
        master={props.master !== undefined}
        onSetLevel={(level) => {
          props.onUpdate({ level });
        }}
        onSetSeason={(season) => {
          props.onUpdate({ season });
        }}
        onSwitchAccreditation={props.onSwitchAccreditation}
        seasonFilter={props.filters.season}
      />

      <Show when={props.master === undefined}>
        <div
          aria-labelledby={tagsLabelId}
          class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
          role="group"
        >
          <span
            class="text-muted-foreground shrink-0 text-xs sm:pt-1.5 sm:text-sm"
            id={tagsLabelId}
          >
            {t().listing.tagsLabel}
          </span>
          <div class="flex min-w-0 flex-col gap-2">
            <TagChips
              isSelected={(tag) => props.filters.tags.includes(tag)}
              onToggle={props.onToggleTag}
            />
            {/* How tags combine matters once there are two, or when "all" is set. */}
            <Show
              when={
                props.filters.tagMode === 'all' || props.filters.tags.length > 1
              }
            >
              <SegmentedControl
                aria-label={t().filters.tagMode}
                class="self-start"
                items={tagModeItems()}
                onSelect={(tagMode) => {
                  props.onUpdate({ tagMode });
                }}
                size="sm"
                value={props.filters.tagMode}
              />
            </Show>
          </div>
        </div>
      </Show>

      <Show when={props.master?.loading}>
        <p
          class="text-muted-foreground text-sm"
          role="status"
        >
          {t().masters.loading}
        </p>
      </Show>
      <Show when={props.master?.error}>
        <div class={ALERT_STYLES.error}>{t().masters.loadError}</div>
      </Show>

      <ListingMoreFilters
        credits={props.credits}
        expanded={props.moreExpanded}
        filters={props.filters}
        onExpandedChange={props.onMoreExpandedChange}
        onUpdate={props.onUpdate}
        programOptions={props.master?.programOptions}
        staff={props.staff}
      />

      <div class="flex flex-wrap items-center gap-2 sm:hidden">
        <span class="text-muted-foreground text-sm">{t().listing.sort}</span>
        <For each={props.sortColumns}>
          {(column) => {
            const isActive = () => props.sortColumn === column;
            return (
              <button
                aria-pressed={isActive()}
                class={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  isActive()
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-foreground hover:bg-muted border-border'
                }`}
                onClick={() => {
                  props.onToggleSort(column);
                }}
                type="button"
              >
                {t().common[SORT_LABEL_KEYS[column]]}
                {isActive() && (
                  <span class="text-[10px] leading-none">
                    {props.sortDirection === 'asc' ? '\u{2191}' : '\u{2193}'}
                  </span>
                )}
              </button>
            );
          }}
        </For>
      </div>

      <ActiveFilterChips
        filters={props.filters}
        onClear={props.onClearFilters}
        onRemove={props.onRemoveChip}
        programLabel={props.master?.programLabel}
        resultCount={props.resultCount}
      />
    </>
  );
};
