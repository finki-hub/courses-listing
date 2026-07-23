import { For } from 'solid-js';

import { CourseFilterRow } from '@/components/course-filter-row';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { SearchInput } from '@/components/ui/search-input';
import {
  SORT_COLUMN_LABELS,
  SORT_COLUMNS,
  type SortColumn,
  type SortDirection,
} from '@/lib/course-filters';
import { cn } from '@/lib/utils';
import {
  type Accreditation,
  ALL_TAGS,
  type CourseLevelFilter,
  FEATURED_TAG,
  getTagLabel,
  type SeasonFilter,
} from '@/types/course';

type CourseListingControlsProps = {
  readonly accreditation: Accreditation | null;
  readonly levelFilter: CourseLevelFilter;
  readonly onSearchInput: (value: string) => void;
  readonly onSetLevel: (level: CourseLevelFilter) => void;
  readonly onSetSeason: (season: SeasonFilter) => void;
  readonly onSwitchAccreditation: (accreditation: Accreditation) => void;
  readonly onToggleSort: (column: SortColumn) => void;
  readonly onToggleTag: (tag: string) => void;
  readonly resultCount: number;
  readonly search: string;
  readonly seasonFilter: SeasonFilter;
  readonly selectedTags: ReadonlySet<string>;
  readonly sortColumn: SortColumn;
  readonly sortDirection: SortDirection;
};

export const CourseListingControls = (props: CourseListingControlsProps) => (
  <>
    <SearchInput
      aria-label="Пребарувај предмети"
      onInput={(event) => {
        props.onSearchInput(event.currentTarget.value);
      }}
      placeholder="Пребарувај предмети..."
      value={props.search}
    />

    <CourseFilterRow
      accreditation={props.accreditation}
      levelFilter={props.levelFilter}
      onSetLevel={props.onSetLevel}
      onSetSeason={props.onSetSeason}
      onSwitchAccreditation={props.onSwitchAccreditation}
      seasonFilter={props.seasonFilter}
    />

    <div class="flex flex-wrap items-center gap-3">
      <span class="text-muted-foreground text-sm">Тагови:</span>
      <For each={ALL_TAGS}>
        {(tag) => (
          <LabeledCheckbox
            checked={props.selectedTags.has(tag)}
            class={cn(
              'gap-1.5',
              tag === FEATURED_TAG &&
                'rounded-md border px-2 py-1 transition-colors [&>input]:accent-amber-500',
              tag === FEATURED_TAG && props.selectedTags.has(tag)
                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                : tag === FEATURED_TAG &&
                    'border-border bg-background hover:bg-muted/50',
            )}
            onChange={() => {
              props.onToggleTag(tag);
            }}
          >
            {getTagLabel(tag)}
          </LabeledCheckbox>
        )}
      </For>
    </div>

    <div class="flex flex-wrap items-center gap-2 sm:hidden">
      <span class="text-muted-foreground text-sm">Сортирај:</span>
      <For each={SORT_COLUMNS}>
        {(column) => {
          const isActive = () => props.sortColumn === column;
          return (
            <button
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
              {SORT_COLUMN_LABELS[column]}
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

    <div class="text-muted-foreground text-sm">
      {props.resultCount} предмети
    </div>
  </>
);
