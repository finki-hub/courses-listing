import { createUniqueId, For, Show } from 'solid-js';

import { X } from '@/components/ui/icons';
import {
  formatCount,
  getTagLabel,
  interpolate,
  type Translations,
} from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type FilterChip, getFilterChips } from '@/lib/listing-filter-chips';
import { type ListingFilters } from '@/lib/listing-url-state';
import { STUDY_PROGRAM_LABELS } from '@/types/course';

// Master's programs read "code: title" like their dropdown, so their kind
// follows after a dot instead of another colon.
const getProgramChipLabel = (
  filters: ListingFilters,
  t: Translations,
  programLabel: ProgramLabel | undefined,
) => {
  const program = filters.program ?? '';
  const label =
    programLabel?.(program) ?? STUDY_PROGRAM_LABELS[program] ?? program;
  if (filters.programState === null) return label;
  const separator = programLabel === undefined ? ': ' : ' \u{B7} ';
  return `${label}${separator}${t.filters[filters.programState]}`;
};

type ChipContext = {
  readonly filters: ListingFilters;
  readonly programLabel?: ProgramLabel;
  readonly t: Translations;
};

type ProgramLabel = (program: string) => string;

const getChipLabel = (
  chip: FilterChip,
  { filters, programLabel, t }: ChipContext,
): string => {
  switch (chip.kind) {
    case 'accreditation':
      return interpolate(t.detail.accreditationYear, { year: chip.value });
    case 'channel':
      return t.filters.channelOnly;
    case 'credits':
      return interpolate(t.listing.creditsValue, { value: chip.value });
    case 'inactive':
      return t.filters.hideInactive;
    case 'level':
      return `L${chip.value}`;
    case 'offered':
      return t.filters.offeredOnly;
    case 'program':
      return getProgramChipLabel(filters, t, programLabel);
    case 'query':
      return interpolate(t.listing.searchChip, { value: chip.value });
    case 'saved':
      return t.filters.savedChip;
    case 'season':
      return chip.value === 'winter' ? t.common.winter : t.common.summer;
    case 'semester':
      return interpolate(t.listing.semesterValue, { value: chip.value });
    case 'staff':
      return chip.value;
    case 'tag':
      return getTagLabel(chip.value, t);
    default:
      return chip.value;
  }
};

type ActiveFilterChipsProps = {
  readonly filters: ListingFilters;
  readonly onClear: () => void;
  readonly onRemove: (chip: FilterChip) => void;
  /** How the master's view names its programs. */
  readonly programLabel?: ProgramLabel;
  readonly resultCount: number;
};

// The result count, then every active filter as a removable chip.
export const ActiveFilterChips = (props: ActiveFilterChipsProps) => {
  const { language, t } = useLanguage();
  const labelId = createUniqueId();
  const chips = () => getFilterChips(props.filters);

  return (
    <div class="flex min-h-6 flex-wrap items-center gap-2 text-sm">
      <span
        aria-live="polite"
        class="text-muted-foreground"
      >
        {formatCount(t().listing.resultCount, {
          count: props.resultCount,
          language: language(),
        })}
      </span>
      <Show when={chips().length > 0}>
        <span
          class="sr-only"
          id={labelId}
        >
          {t().filters.activeFilters}
        </span>
        <ul
          aria-labelledby={labelId}
          class="flex flex-wrap items-center gap-1.5"
        >
          <For each={chips()}>
            {(chip) => {
              const label = () =>
                getChipLabel(chip, {
                  filters: props.filters,
                  programLabel: props.programLabel,
                  t: t(),
                });
              return (
                <li class="flex">
                  <button
                    aria-label={interpolate(t().filters.removeChip, {
                      filter: label(),
                    })}
                    class="bg-muted text-foreground hover:bg-muted/70 inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 py-px text-xs font-medium transition-colors"
                    onClick={() => {
                      props.onRemove(chip);
                    }}
                    type="button"
                  >
                    {label()}
                    <X
                      aria-hidden="true"
                      class="h-3 w-3"
                    />
                  </button>
                </li>
              );
            }}
          </For>
        </ul>
        <button
          class="text-primary text-xs font-medium underline-offset-2 hover:underline"
          onClick={() => {
            props.onClear();
          }}
          type="button"
        >
          {t().filters.clearAll}
        </button>
      </Show>
    </div>
  );
};
