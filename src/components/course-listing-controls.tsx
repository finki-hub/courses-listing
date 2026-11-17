import { For, Show } from 'solid-js';

import { ActiveFilterChips } from '@/components/active-filter-chips';
import { CourseFilterRow } from '@/components/course-filter-row';
import { FilterGroup } from '@/components/filter-group';
import { ListingMoreFilters } from '@/components/listing-more-filters';
import { ButtonGroup } from '@/components/ui/button-group';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { SearchInput } from '@/components/ui/search-input';
import { ALERT_STYLES } from '@/lib/alert-styles';
import { type SortColumn, type SortDirection } from '@/lib/course-filters';
import { getTagLabel } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type FilterChip } from '@/lib/listing-filter-chips';
import { type ListingFilters, type StudyCycle } from '@/lib/listing-url-state';
import { cn } from '@/lib/utils';
import { type Accreditation, ALL_TAGS, FEATURED_TAG } from '@/types/course';

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
        <ButtonGroup
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
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-muted-foreground text-sm">
            {t().listing.tagsLabel}
          </span>
          <For each={ALL_TAGS}>
            {(tag) => (
              <LabeledCheckbox
                checked={props.filters.tags.includes(tag)}
                class={cn(
                  'gap-1.5',
                  tag === FEATURED_TAG &&
                    'rounded-md border px-2 py-1 transition-colors [&>input]:accent-amber-500',
                  tag === FEATURED_TAG && props.filters.tags.includes(tag)
                    ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                    : tag === FEATURED_TAG &&
                        'border-border bg-background hover:bg-muted/50',
                )}
                onChange={() => {
                  props.onToggleTag(tag);
                }}
              >
                {getTagLabel(tag, t())}
              </LabeledCheckbox>
            )}
          </For>
          <ButtonGroup
            aria-label={t().filters.tagMode}
            class="w-full sm:w-auto"
            items={tagModeItems()}
            onSelect={(tagMode) => {
              props.onUpdate({ tagMode });
            }}
            value={props.filters.tagMode}
          />
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
