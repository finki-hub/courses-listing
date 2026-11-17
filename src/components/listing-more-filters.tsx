import { ChevronDown } from 'lucide-solid';
import { createUniqueId, For, Show } from 'solid-js';

import { FilterGroup } from '@/components/filter-group';
import { FIELD_CLASS } from '@/components/ui/field';
import { InfoTip } from '@/components/ui/info-tip';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { getListingPrograms } from '@/lib/course-facts';
import { type ProgramStateFilter } from '@/lib/course-filters';
import { getStudyProgramName } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type ListingFilters } from '@/lib/listing-url-state';
import { STUDY_PROGRAM_LABELS } from '@/types/course';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

type ListingMoreFiltersProps = {
  readonly credits: readonly number[];
  readonly expanded: boolean;
  readonly filters: ListingFilters;
  readonly onExpandedChange: (expanded: boolean) => void;
  readonly onUpdate: (patch: Partial<ListingFilters>) => void;
  /** Master's programs; without them, the accreditation's study programs. */
  readonly programOptions?: ReadonlyArray<{ label: string; value: string }>;
  readonly staff: readonly string[];
};

// Less common filters, behind a disclosure to keep the controls short.
export const ListingMoreFilters = (props: ListingMoreFiltersProps) => {
  const { t } = useLanguage();
  const panelId = createUniqueId();
  const staffListId = createUniqueId();

  const programLabel = (program: string) => {
    const label = STUDY_PROGRAM_LABELS[program] ?? program;
    const name = getStudyProgramName(program, t());
    return name === undefined ? label : `${label}: ${name}`;
  };
  const programOptions = () =>
    props.programOptions ??
    getListingPrograms(props.filters.accreditation).map((program) => ({
      label: programLabel(program),
      value: program,
    }));
  const programStateItems = () =>
    [
      { label: t().filters.required, value: 'required' },
      { label: t().filters.elective, value: 'elective' },
    ] as const;

  // Filters as you type; the list only suggests full names.
  const applyStaff = (value: string) => {
    props.onUpdate({ staff: value });
  };

  return (
    <div class="space-y-3">
      <button
        aria-controls={panelId}
        aria-expanded={props.expanded}
        class="bg-card text-foreground hover:bg-muted inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors"
        onClick={() => {
          props.onExpandedChange(!props.expanded);
        }}
        type="button"
      >
        {t().filters.more}
        <ChevronDown
          aria-hidden="true"
          class={`h-4 w-4 transition-transform ${props.expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <Show when={props.expanded}>
        <div
          class="bg-card grid gap-3 rounded-lg border p-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3"
          id={panelId}
        >
          <FilterGroup label={t().filters.program}>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                aria-label={t().filters.program}
                class="sm:w-64"
                emptyLabel={t().filters.programAll}
                onChange={(value) => {
                  const program = value || null;
                  props.onUpdate({
                    program,
                    programState:
                      program === null ? null : props.filters.programState,
                  });
                }}
                options={programOptions()}
                value={props.filters.program}
              />
              <Show when={props.filters.program !== null}>
                <SegmentedControl
                  allLabel={t().common.all}
                  aria-label={t().filters.program}
                  class="w-full sm:w-auto"
                  items={programStateItems()}
                  onClear={() => {
                    props.onUpdate({ programState: null });
                  }}
                  onSelect={(value: NonNullable<ProgramStateFilter>) => {
                    props.onUpdate({ programState: value });
                  }}
                  value={props.filters.programState}
                />
              </Show>
            </div>
          </FilterGroup>

          <Show when={props.programOptions === undefined}>
            <FilterGroup label={t().filters.semesterNumber}>
              <SegmentedControl
                allLabel={t().common.all}
                class="w-full sm:w-auto"
                items={SEMESTERS.map((value) => ({
                  label: String(value),
                  value,
                }))}
                onClear={() => {
                  props.onUpdate({ semester: null });
                }}
                onSelect={(semester) => {
                  props.onUpdate({ semester });
                }}
                size="sm"
                value={props.filters.semester}
              />
            </FilterGroup>
          </Show>

          <FilterGroup label={t().filters.credits}>
            <SegmentedControl
              allLabel={t().common.all}
              class="w-full sm:w-auto"
              items={props.credits.map((value) => ({
                label: String(value),
                value,
              }))}
              onClear={() => {
                props.onUpdate({ credits: null });
              }}
              onSelect={(credits) => {
                props.onUpdate({ credits });
              }}
              value={props.filters.credits}
            />
          </FilterGroup>

          <FilterGroup label={t().filters.staff}>
            <input
              aria-label={t().filters.staff}
              class={`${FIELD_CLASS} sm:w-64`}
              list={staffListId}
              onChange={(event) => {
                applyStaff(event.currentTarget.value);
              }}
              onInput={(event) => {
                applyStaff(event.currentTarget.value);
              }}
              placeholder={t().filters.staffPlaceholder}
              type="search"
              value={props.filters.staff}
            />
            <datalist id={staffListId}>
              <For each={props.staff}>{(name) => <option value={name} />}</For>
            </datalist>
          </FilterGroup>

          <FilterGroup label={t().filters.status}>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span class="inline-flex items-center gap-1">
                <LabeledCheckbox
                  checked={props.filters.hideInactive}
                  onChange={() => {
                    props.onUpdate({
                      hideInactive: !props.filters.hideInactive,
                    });
                  }}
                >
                  {t().filters.hideInactive}
                </LabeledCheckbox>
                <InfoTip text={t().filters.hideInactiveInfo} />
              </span>
              <span class="inline-flex items-center gap-1">
                <LabeledCheckbox
                  checked={props.filters.offeredOnly}
                  onChange={() => {
                    props.onUpdate({ offeredOnly: !props.filters.offeredOnly });
                  }}
                >
                  {t().filters.offeredOnly}
                </LabeledCheckbox>
                <InfoTip text={t().filters.offeredInfo} />
              </span>
              <LabeledCheckbox
                checked={props.filters.channelOnly}
                onChange={() => {
                  props.onUpdate({ channelOnly: !props.filters.channelOnly });
                }}
              >
                {t().filters.channelOnly}
              </LabeledCheckbox>
            </div>
          </FilterGroup>
        </div>
      </Show>
    </div>
  );
};
