import { type JSX } from '@solidjs/web';
import { createSignal, createUniqueId, For, Show, untrack } from 'solid-js';

import { AccreditationSwitch } from '@/components/accreditation-switch';
import { CourseLevelFilter } from '@/components/course-level-filter';
import { ShareSavedButton } from '@/components/saved-courses-ui';
import { TagChips } from '@/components/tag-chips';
import { FIELD_CLASS } from '@/components/ui/field';
import { ChevronDown } from '@/components/ui/icons';
import { InfoTip } from '@/components/ui/info-tip';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { getListingPrograms } from '@/lib/course-facts';
import { type ProgramStateFilter } from '@/lib/course-filters';
import { getStudyProgramName, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type FilterSection as FilterSectionKey,
  getActiveFilterSections,
} from '@/lib/listing-filter-chips';
import { type ListingFilters } from '@/lib/listing-url-state';
import { LEVEL_CREDIT_LIMITS } from '@/lib/simulator';
import { type Accreditation, STUDY_PROGRAM_LABELS } from '@/types/course';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const SECTIONS_STORAGE_KEY = 'listing-filter-sections';

const TRAILING_COLON = /:\s*$/u;

// The segmented track hugs its options on wide screens instead of leaving an
// empty tail after the last one.
const SEGMENTED_WIDTH = 'w-full sm:w-fit';

// Rarely used groups start collapsed; a group holding an active filter opens.
const DEFAULT_OPEN: Record<FilterSectionKey, boolean> = {
  curriculum: true,
  people: false,
  program: true,
  status: true,
  topics: true,
};

// The shared labels end in a colon for inline rows; stacked labels don't.
export const stackedLabel = (label: string) =>
  label.replace(TRAILING_COLON, '');

const numberItems = (values: readonly number[]) =>
  values.map((value) => ({ label: String(value), value }));

const readOpenSections = (): Partial<Record<FilterSectionKey, boolean>> => {
  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(SECTIONS_STORAGE_KEY) ?? '{}',
    );
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const writeOpenSection = (section: FilterSectionKey, open: boolean) => {
  try {
    sessionStorage.setItem(
      SECTIONS_STORAGE_KEY,
      JSON.stringify({ ...readOpenSections(), [section]: open }),
    );
  } catch {
    // Without storage the panel just forgets which groups were open.
  }
};

type FilterSectionProps = {
  /** Holds an active filter: open whatever was saved. */
  active: boolean;
  children: JSX.Element;
  section: FilterSectionKey;
  title: string;
};

// A collapsible group of filters, remembered for the browser session; a
// group holding an active filter always starts open.
const FilterSection = (props: FilterSectionProps) => {
  const bodyId = createUniqueId();
  const [open, setOpen] = createSignal(
    untrack(
      () =>
        props.active ||
        (readOpenSections()[props.section] ?? DEFAULT_OPEN[props.section]),
    ),
  );
  return (
    <section class="border-b py-3 last:border-b-0">
      <h3>
        <button
          aria-controls={bodyId}
          aria-expanded={open() ? 'true' : 'false'}
          class="focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-md py-1 text-left text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => {
            const next = !open();
            setOpen(next);
            writeOpenSection(props.section, next);
          }}
          type="button"
        >
          {props.title}
          <ChevronDown
            aria-hidden="true"
            class={`text-muted-foreground h-4 w-4 transition-transform motion-reduce:transition-none ${open() ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      <Show when={open()}>
        <div
          class="space-y-4 pt-3"
          id={bodyId}
        >
          {props.children}
        </div>
      </Show>
    </section>
  );
};

type FilterFieldProps = {
  children: JSX.Element;
  info?: string;
  label: string;
};

// One labelled filter, the label above its control.
const FilterField = (props: FilterFieldProps) => {
  const labelId = createUniqueId();
  return (
    <div
      aria-labelledby={labelId}
      class="space-y-1.5"
      role="group"
    >
      <div class="flex items-center gap-1">
        <span
          class="text-muted-foreground text-xs font-medium"
          id={labelId}
        >
          {stackedLabel(props.label)}
        </span>
        <Show when={props.info}>{(info) => <InfoTip text={info()} />}</Show>
      </div>
      {props.children}
    </div>
  );
};

export type ListingFilterPanelProps = {
  readonly credits: readonly number[];
  readonly filters: ListingFilters;
  /** Master's programs; without them, the accreditation's study programs. */
  readonly masterPrograms?: ReadonlyArray<{ label: string; value: string }>;
  readonly onShareSaved: () => Promise<boolean>;
  readonly onSwitchAccreditation: (accreditation: Accreditation) => void;
  readonly onToggleTag: (tag: string) => void;
  readonly onUpdate: (patch: Partial<ListingFilters>) => void;
  /** How many courses the student has saved. */
  readonly savedCount: number;
  readonly staff: readonly string[];
};

type SectionProps = ListingFilterPanelProps & { readonly active: boolean };

const CurriculumSection = (props: SectionProps) => {
  const { t } = useLanguage();
  const master = () => props.masterPrograms !== undefined;
  const levelInfo = () =>
    interpolate(t().filters.levelInfo, {
      l1: LEVEL_CREDIT_LIMITS[1] ?? 0,
      l2: LEVEL_CREDIT_LIMITS[2] ?? 0,
    });

  return (
    <FilterSection
      active={props.active}
      section="curriculum"
      title={t().filters.sections.curriculum}
    >
      <Show when={!master()}>
        <FilterField label={t().filters.accreditation}>
          <AccreditationSwitch
            accreditation={props.filters.accreditation}
            onClear={() => {
              const current = props.filters.accreditation;
              if (current !== null) props.onSwitchAccreditation(current);
            }}
            onSelect={props.onSwitchAccreditation}
          />
        </FilterField>
      </Show>
      <FilterField label={t().filters.season}>
        <SegmentedControl
          allLabel={t().common.all}
          class={SEGMENTED_WIDTH}
          items={[
            { label: t().common.winter, value: 'winter' as const },
            { label: t().common.summer, value: 'summer' as const },
          ]}
          onClear={() => {
            props.onUpdate({ season: null });
          }}
          onSelect={(season) => {
            props.onUpdate({ season });
          }}
          size="sm"
          value={props.filters.season}
        />
      </FilterField>
      <Show when={!master()}>
        <FilterField label={t().filters.semesterNumber}>
          <SegmentedControl
            allLabel={t().common.all}
            class={SEGMENTED_WIDTH}
            items={numberItems(SEMESTERS)}
            onClear={() => {
              props.onUpdate({ semester: null });
            }}
            onSelect={(semester) => {
              props.onUpdate({ semester });
            }}
            size="sm"
            value={props.filters.semester}
          />
        </FilterField>
        <FilterField
          info={levelInfo()}
          label={t().filters.level}
        >
          <CourseLevelFilter
            class={SEGMENTED_WIDTH}
            onSelect={(level) => {
              props.onUpdate({ level });
            }}
            value={props.filters.level}
          />
        </FilterField>
      </Show>
      <Show when={props.credits.length > 0}>
        <FilterField label={t().filters.credits}>
          <SegmentedControl
            allLabel={t().common.all}
            class={SEGMENTED_WIDTH}
            items={numberItems(props.credits)}
            onClear={() => {
              props.onUpdate({ credits: null });
            }}
            onSelect={(credits) => {
              props.onUpdate({ credits });
            }}
            size="sm"
            value={props.filters.credits}
          />
        </FilterField>
      </Show>
    </FilterSection>
  );
};

const ProgramSection = (props: SectionProps) => {
  const { t } = useLanguage();
  const label = () => stackedLabel(t().filters.program);
  const studyProgramLabel = (code: string) => {
    const short = STUDY_PROGRAM_LABELS[code] ?? code;
    const name = getStudyProgramName(code, t());
    return name === undefined ? short : `${short}: ${name}`;
  };
  const options = () =>
    props.masterPrograms ??
    getListingPrograms(props.filters.accreditation).map((code) => ({
      label: studyProgramLabel(code),
      value: code,
    }));

  return (
    <FilterSection
      active={props.active}
      section="program"
      title={t().filters.sections.program}
    >
      <Select
        aria-label={label()}
        emptyLabel={t().filters.programAll}
        onChange={(value) => {
          const selected = value || null;
          props.onUpdate({
            program: selected,
            programState: selected === null ? null : props.filters.programState,
          });
        }}
        options={options()}
        value={props.filters.program}
      />
      <Show when={props.filters.program !== null}>
        <SegmentedControl
          allLabel={t().common.all}
          aria-label={label()}
          class={SEGMENTED_WIDTH}
          items={[
            { label: t().filters.required, value: 'required' as const },
            { label: t().filters.elective, value: 'elective' as const },
          ]}
          onClear={() => {
            props.onUpdate({ programState: null });
          }}
          onSelect={(value: NonNullable<ProgramStateFilter>) => {
            props.onUpdate({ programState: value });
          }}
          size="sm"
          value={props.filters.programState}
        />
      </Show>
    </FilterSection>
  );
};

const TopicsSection = (props: SectionProps) => {
  const { t } = useLanguage();
  return (
    <FilterSection
      active={props.active}
      section="topics"
      title={t().filters.sections.topics}
    >
      <TagChips
        class="m-0 flex-wrap overflow-visible p-0"
        isSelected={(tag) => props.filters.tags.includes(tag)}
        onToggle={props.onToggleTag}
      />
      <Show
        when={props.filters.tags.length > 1 || props.filters.tagMode === 'all'}
      >
        <FilterField label={t().filters.tagMode}>
          <SegmentedControl
            class={SEGMENTED_WIDTH}
            items={[
              { label: t().filters.tagModeAny, value: 'any' as const },
              { label: t().filters.tagModeAll, value: 'all' as const },
            ]}
            onSelect={(tagMode) => {
              props.onUpdate({ tagMode });
            }}
            size="sm"
            value={props.filters.tagMode}
          />
        </FilterField>
      </Show>
    </FilterSection>
  );
};

const StatusFlagRow = (props: {
  checked: boolean;
  info?: string;
  label: string;
  onChange: () => void;
}) => {
  const id = createUniqueId();
  return (
    <li class="flex items-start gap-2 text-sm">
      <input
        checked={props.checked}
        class="accent-primary mt-0.5 h-4 w-4 dark:[color-scheme:dark]"
        id={id}
        onChange={() => {
          props.onChange();
        }}
        type="checkbox"
      />
      <span class="flex min-w-0 items-start gap-1.5">
        {/* Before the label, so a wrapped label never leaves the icon
            stranded at the far right of the row. */}
        <Show when={props.info}>
          {(info) => (
            <InfoTip
              class="-mt-0.5 shrink-0"
              text={info()}
            />
          )}
        </Show>
        <label
          class="cursor-pointer pt-0.5"
          for={id}
        >
          {props.label}
        </label>
      </span>
    </li>
  );
};

const StatusSection = (props: SectionProps) => {
  type FlagKey = 'channelOnly' | 'hideInactive' | 'offeredOnly' | 'savedOnly';
  const { t } = useLanguage();
  const flags = (): ReadonlyArray<{
    info?: string;
    key: FlagKey;
    label: string;
  }> => [
    {
      info: t().filters.hideInactiveInfo,
      key: 'hideInactive',
      label: t().filters.hideInactive,
    },
    {
      info: t().filters.offeredInfo,
      key: 'offeredOnly',
      label: t().filters.offeredOnly,
    },
    {
      info: t().filters.channelInfo,
      key: 'channelOnly',
      label: t().filters.channelOnly,
    },
    {
      info: t().filters.savedInfo,
      key: 'savedOnly',
      label: interpolate(t().filters.savedOnly, { count: props.savedCount }),
    },
  ];

  return (
    <FilterSection
      active={props.active}
      section="status"
      title={t().filters.sections.status}
    >
      <ul class="space-y-2">
        <For
          each={flags()}
          keyed={(flag) => flag.key}
        >
          {(flag) => (
            <StatusFlagRow
              checked={props.filters[flag().key]}
              info={flag().info}
              label={flag().label}
              onChange={() => {
                props.onUpdate({ [flag().key]: !props.filters[flag().key] });
              }}
            />
          )}
        </For>
      </ul>
      <Show when={props.savedCount > 0}>
        <div class="mt-2">
          <ShareSavedButton onShare={props.onShareSaved} />
        </div>
      </Show>
    </FilterSection>
  );
};

const PeopleSection = (props: SectionProps) => {
  const { t } = useLanguage();
  const staffListId = createUniqueId();
  return (
    <FilterSection
      active={props.active}
      section="people"
      title={t().filters.sections.people}
    >
      <input
        aria-label={stackedLabel(t().filters.staff)}
        class={FIELD_CLASS}
        list={staffListId}
        onInput={(event) => {
          props.onUpdate({ staff: event.currentTarget.value });
        }}
        placeholder={t().filters.staffPlaceholder}
        type="search"
        value={props.filters.staff}
      />
      <datalist id={staffListId}>
        <For each={props.staff}>{(name) => <option value={name} />}</For>
      </datalist>
    </FilterSection>
  );
};

// Every listing filter, grouped: the desktop sidebar and the mobile sheet
// both show this panel. The master's view leads with its programs.
export const ListingFilterPanel = (props: ListingFilterPanelProps) => {
  const active = untrack(() => getActiveFilterSections(props.filters));
  const master = () => props.masterPrograms !== undefined;

  return (
    <div>
      <Show
        fallback={
          <>
            <CurriculumSection
              {...props}
              active={active.has('curriculum')}
            />
            <ProgramSection
              {...props}
              active={active.has('program')}
            />
            <TopicsSection
              {...props}
              active={active.has('topics')}
            />
          </>
        }
        when={master()}
      >
        <ProgramSection
          {...props}
          active={active.has('program')}
        />
        <CurriculumSection
          {...props}
          active={active.has('curriculum')}
        />
      </Show>
      <StatusSection
        {...props}
        active={active.has('status')}
      />
      <PeopleSection
        {...props}
        active={active.has('people')}
      />
    </div>
  );
};
