import { ChevronDown } from 'lucide-solid';
import {
  createSignal,
  createUniqueId,
  For,
  type JSX,
  Show,
  untrack,
} from 'solid-js';

import { AccreditationSwitch } from '@/components/accreditation-switch';
import { CourseLevelFilter } from '@/components/course-level-filter';
import { TagChips } from '@/components/tag-chips';
import { FIELD_CLASS } from '@/components/ui/field';
import { InfoTip } from '@/components/ui/info-tip';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
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

const FULL_WIDTH = 'w-full sm:flex sm:w-full';

// Rarely used groups start collapsed; a group holding an active filter opens.
const DEFAULT_OPEN: Record<FilterSectionKey, boolean> = {
  curriculum: true,
  people: false,
  program: true,
  status: false,
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
  children: JSX.Element;
  defaultOpen: boolean;
  section: FilterSectionKey;
  title: string;
};

// A collapsible group of filters, remembered for the browser session.
const FilterSection = (props: FilterSectionProps) => {
  const bodyId = createUniqueId();
  const [open, setOpen] = createSignal(
    untrack(() => readOpenSections()[props.section] ?? props.defaultOpen),
  );
  return (
    <section class="border-b py-3 last:border-b-0">
      <h3>
        <button
          aria-controls={bodyId}
          aria-expanded={open()}
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
  readonly onSwitchAccreditation: (accreditation: Accreditation) => void;
  readonly onToggleTag: (tag: string) => void;
  readonly onUpdate: (patch: Partial<ListingFilters>) => void;
  readonly staff: readonly string[];
};

type SectionProps = ListingFilterPanelProps & { readonly open: boolean };

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
      defaultOpen={props.open}
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
          class={FULL_WIDTH}
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
            class={FULL_WIDTH}
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
            class={FULL_WIDTH}
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
            class={FULL_WIDTH}
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
      defaultOpen={props.open}
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
          class={FULL_WIDTH}
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
      defaultOpen={props.open}
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
            class={FULL_WIDTH}
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

const StatusSection = (props: SectionProps) => {
  type FlagKey = 'channelOnly' | 'hideInactive' | 'offeredOnly';
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
    { key: 'channelOnly', label: t().filters.channelOnly },
  ];

  return (
    <FilterSection
      defaultOpen={props.open}
      section="status"
      title={t().filters.sections.status}
    >
      <ul class="space-y-2">
        <For each={flags()}>
          {(flag) => (
            <li class="flex items-center gap-1">
              <LabeledCheckbox
                checked={props.filters[flag.key]}
                onChange={() => {
                  props.onUpdate({ [flag.key]: !props.filters[flag.key] });
                }}
              >
                {flag.label}
              </LabeledCheckbox>
              <Show when={flag.info}>
                {(info) => <InfoTip text={info()} />}
              </Show>
            </li>
          )}
        </For>
      </ul>
    </FilterSection>
  );
};

const PeopleSection = (props: SectionProps) => {
  const { t } = useLanguage();
  const staffListId = createUniqueId();
  return (
    <FilterSection
      defaultOpen={props.open}
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
  const isOpen = (section: FilterSectionKey) =>
    DEFAULT_OPEN[section] || active.has(section);
  const master = () => props.masterPrograms !== undefined;

  return (
    <div>
      <Show
        fallback={
          <>
            <CurriculumSection
              {...props}
              open={isOpen('curriculum')}
            />
            <ProgramSection
              {...props}
              open={isOpen('program')}
            />
            <TopicsSection
              {...props}
              open={isOpen('topics')}
            />
          </>
        }
        when={master()}
      >
        <ProgramSection
          {...props}
          open={isOpen('program')}
        />
        <CurriculumSection
          {...props}
          open={isOpen('curriculum')}
        />
      </Show>
      <StatusSection
        {...props}
        open={isOpen('status')}
      />
      <PeopleSection
        {...props}
        open={isOpen('people')}
      />
    </div>
  );
};
