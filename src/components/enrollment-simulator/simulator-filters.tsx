import { RotateCcw, SlidersHorizontal } from 'lucide-solid';
import { createSignal, createUniqueId, For, Show } from 'solid-js';

import { FilterGroup } from '@/components/filter-group';
import { ButtonGroup } from '@/components/ui/button-group';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { SearchInput } from '@/components/ui/search-input';
import { getTagLabel } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  COURSE_TYPE_FILTERS,
  type CourseTypeFilter,
} from '@/lib/simulator-view';
import { ALL_TAGS } from '@/types/course';

type SimulatorFiltersProps = {
  activeFilterCount: number;
  onReset: () => void;
  onSearch: (value: string) => void;
  onSetType: (type: CourseTypeFilter) => void;
  onToggleOnlyEnabled: () => void;
  onToggleTag: (tag: string) => void;
  search: string;
  showOnlyEnabled: boolean;
  tags: ReadonlySet<string>;
  type: CourseTypeFilter;
};

// The search box, a disclosure with the less used filters and, on narrow
// screens, the reset button, all in one row so the toolbar keeps its height.
export const SimulatorFilters = (props: SimulatorFiltersProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = createSignal(false);
  const panelId = createUniqueId();
  const typeItems = () =>
    COURSE_TYPE_FILTERS.map((type) => ({
      label: t().simulator.courseType[type],
      value: type,
    }));

  return (
    <div class="space-y-3">
      <div class="flex gap-2">
        <div class="min-w-0 flex-1">
          <SearchInput
            aria-label={t().simulator.search}
            onInput={(event) => {
              props.onSearch(event.currentTarget.value);
            }}
            placeholder={t().prerequisites.searchPlaceholder}
            value={props.search}
          />
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={open()}
          class="hover:bg-muted inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <SlidersHorizontal
            aria-hidden="true"
            class="h-4 w-4"
          />
          <span class="hidden sm:inline">{t().simulator.filters}</span>
          <span class="sr-only sm:hidden">{t().simulator.filters}</span>
          <Show when={props.activeFilterCount > 0}>
            <span class="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
              {props.activeFilterCount}
            </span>
          </Show>
        </button>
        <button
          aria-label={t().simulator.reset}
          class="text-destructive hover:bg-destructive/10 inline-flex min-h-9 shrink-0 items-center rounded-md border px-2.5 transition-colors sm:hidden"
          onClick={() => {
            props.onReset();
          }}
          title={t().simulator.reset}
          type="button"
        >
          <RotateCcw
            aria-hidden="true"
            class="h-4 w-4"
          />
        </button>
      </div>

      <div
        class="grid gap-3 rounded-md border p-3"
        hidden={!open()}
        id={panelId}
      >
        <FilterGroup label={t().simulator.courseTypeLabel}>
          <ButtonGroup
            class="w-full sm:w-auto"
            items={typeItems()}
            onSelect={props.onSetType}
            value={props.type}
          />
        </FilterGroup>
        <FilterGroup label={t().listing.tagsLabel}>
          <div class="flex flex-wrap gap-x-3 gap-y-2">
            <For each={ALL_TAGS}>
              {(tag) => (
                <LabeledCheckbox
                  checked={props.tags.has(tag)}
                  onChange={() => {
                    props.onToggleTag(tag);
                  }}
                >
                  {getTagLabel(tag, t())}
                </LabeledCheckbox>
              )}
            </For>
          </div>
        </FilterGroup>
        <LabeledCheckbox
          checked={props.showOnlyEnabled}
          onChange={props.onToggleOnlyEnabled}
        >
          {t().simulator.onlyAvailable}
        </LabeledCheckbox>
      </div>
    </div>
  );
};
