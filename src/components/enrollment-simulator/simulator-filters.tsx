import { type JSX } from '@solidjs/web';
import { createSignal, Show } from 'solid-js';

import { CourseLevelFilter } from '@/components/course-level-filter';
import { FilterGroup } from '@/components/filter-group';
import { TagChips } from '@/components/tag-chips';
import { SlidersHorizontal } from '@/components/ui/icons';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { SearchInput } from '@/components/ui/search-input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Sheet } from '@/components/ui/sheet';
import { formatCount, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { LEVEL_CREDIT_LIMITS } from '@/lib/simulator';
import {
  COURSE_TYPE_FILTERS,
  type CourseTypeFilter,
} from '@/lib/simulator-view';
import { cn } from '@/lib/utils';
import {
  type CourseLevelFilter as LevelValue,
  type SeasonFilter,
} from '@/types/course';

type SimulatorFiltersProps = {
  /** Active filters that only apply to the checklist and the plan. */
  checklistOnlyCount: number;
  /** "What next" only narrows by semester and level. */
  courseFilters: boolean;
  level: LevelValue;
  onClearChecklistFilters: () => void;
  onSearch: (value: string) => void;
  onSetLevel: (level: LevelValue) => void;
  onSetSeason: (season: SeasonFilter) => void;
  onSetType: (type: CourseTypeFilter) => void;
  onToggleOnlyEnabled: () => void;
  onToggleTag: (tag: string) => void;
  search: string;
  season: SeasonFilter;
  showOnlyEnabled: boolean;
  tags: ReadonlySet<string>;
  type: CourseTypeFilter;
};

const isSeason = (value: string): value is 'summer' | 'winter' =>
  value === 'summer' || value === 'winter';

const FilterCount = (props: { class: string; count: number }) => (
  <Show when={props.count > 0}>
    <span
      class={cn(
        'bg-primary text-primary-foreground items-center rounded-full px-1.5 text-xs tabular-nums',
        props.class,
      )}
    >
      {props.count}
    </span>
  </Show>
);

// One toolbar for narrowing the courses. On wide screens the semester, level
// and type sit inline next to the search and the panel holds the rest; on
// phones everything but the search moves into the panel.
export const SimulatorFilters = (props: SimulatorFiltersProps) => {
  const { language, t } = useLanguage();
  const [open, setOpen] = createSignal(false);

  const levelInfo = () =>
    interpolate(t().filters.levelInfo, {
      l1: LEVEL_CREDIT_LIMITS[1] ?? 0,
      l2: LEVEL_CREDIT_LIMITS[2] ?? 0,
    });

  const season = (): JSX.Element => (
    <SegmentedControl
      allLabel={t().common.all}
      class="w-full sm:w-auto"
      items={[
        { label: t().common.winter, value: 'winter' },
        { label: t().common.summer, value: 'summer' },
      ]}
      onClear={() => {
        props.onSetSeason(null);
      }}
      onSelect={(value) => {
        props.onSetSeason(isSeason(value) ? value : null);
      }}
      size="sm"
      value={props.season}
    />
  );
  const type = (): JSX.Element => (
    <SegmentedControl
      class="w-full sm:w-auto"
      items={COURSE_TYPE_FILTERS.map((value) => ({
        label: t().simulator.courseType[value],
        value,
      }))}
      onSelect={props.onSetType}
      size="sm"
      value={props.type}
    />
  );

  // The semester and level, inline on wide screens and in the panel on phones.
  const periodFilters = (): JSX.Element => (
    <>
      <FilterGroup label={t().filters.season}>{season()}</FilterGroup>
      <FilterGroup
        info={levelInfo()}
        label={t().filters.level}
      >
        <CourseLevelFilter
          onSelect={props.onSetLevel}
          value={props.level}
        />
      </FilterGroup>
    </>
  );

  const inlineCount = () =>
    (props.season === null ? 0 : 1) + (props.level === null ? 0 : 1);
  const panelCount = () => {
    if (!props.courseFilters) return 0;
    return (
      (props.type === 'all' ? 0 : 1) +
      props.tags.size +
      (props.showOnlyEnabled ? 1 : 0)
    );
  };

  return (
    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
      <Show when={props.courseFilters}>
        <div class="min-w-0 flex-1 sm:min-w-64">
          <SearchInput
            aria-label={t().simulator.search}
            onInput={(event: Event & { currentTarget: HTMLInputElement }) => {
              props.onSearch(event.currentTarget.value);
            }}
            placeholder={t().prerequisites.searchPlaceholder}
            value={props.search}
          />
        </div>
      </Show>

      <div class="hidden flex-wrap items-center gap-x-4 gap-y-2 sm:flex">
        {periodFilters()}
      </div>

      <button
        aria-haspopup="dialog"
        class={cn(
          'bg-card hover:bg-muted focus-visible:ring-ring inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
          !props.courseFilters && 'sm:hidden',
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <SlidersHorizontal
          aria-hidden="true"
          class="h-4 w-4"
        />
        <span>{t().simulator.filters}</span>
        <FilterCount
          class="inline-flex sm:hidden"
          count={inlineCount() + panelCount()}
        />
        <FilterCount
          class="hidden sm:inline-flex"
          count={panelCount()}
        />
      </button>

      <Show when={!props.courseFilters && props.checklistOnlyCount > 0}>
        <p class="text-muted-foreground flex w-full flex-wrap items-center gap-x-2 text-xs">
          {formatCount(t().simulator.checklistOnly, {
            count: props.checklistOnlyCount,
            language: language(),
          })}
          <button
            class="text-foreground hover:bg-muted focus-visible:ring-ring rounded px-1 font-medium underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => {
              props.onClearChecklistFilters();
            }}
            type="button"
          >
            {t().simulator.clearChecklistFilters}
          </button>
        </p>
      </Show>

      <Sheet
        onOpenChange={setOpen}
        open={open()}
        title={t().simulator.filters}
      >
        <div class="space-y-5">
          <div class="space-y-4 sm:hidden">{periodFilters()}</div>
          <Show when={props.courseFilters}>
            <FilterGroup label={t().simulator.courseTypeLabel}>
              {type()}
            </FilterGroup>
            <div class="space-y-2">
              <p class="text-sm font-medium">{t().listing.tagsLabel}</p>
              <TagChips
                class="mx-0 flex-wrap overflow-visible px-0"
                isSelected={(tag) => props.tags.has(tag)}
                onToggle={props.onToggleTag}
              />
            </div>
            <LabeledCheckbox
              checked={props.showOnlyEnabled}
              onChange={props.onToggleOnlyEnabled}
            >
              {t().simulator.onlyAvailable}
            </LabeledCheckbox>
          </Show>
        </div>
      </Sheet>
    </div>
  );
};
