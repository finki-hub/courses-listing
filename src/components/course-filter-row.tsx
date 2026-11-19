import { Show } from 'solid-js';

import { AccreditationSwitch } from '@/components/accreditation-switch';
import { CourseLevelFilter } from '@/components/course-level-filter';
import { FilterGroup } from '@/components/filter-group';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { getStudyProgramName, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { LEVEL_CREDIT_LIMITS } from '@/lib/simulator';
import {
  type Accreditation,
  type CourseLevelFilter as CourseLevelFilterValue,
  getStudyPrograms,
  type SeasonFilter,
  STUDY_PROGRAM_LABELS,
} from '@/types/course';

const isSeasonFilter = (value: string): value is 'summer' | 'winter' =>
  value === 'summer' || value === 'winter';

type CourseFilterRowProps = {
  readonly accreditation: Accreditation | null;
  /** The listing can show both accreditations at once; the simulator can't. */
  readonly clearableAccreditation?: boolean;
  readonly levelFilter: CourseLevelFilterValue;
  /** Master's courses have no accreditations or levels. */
  readonly master?: boolean;
  readonly onSetLevel: (level: CourseLevelFilterValue) => void;
  readonly onSetSeason: (season: SeasonFilter) => void;
  readonly onSwitchAccreditation: (accreditation: Accreditation) => void;
  readonly onSwitchProgram?: (program: string) => void;
  readonly program?: null | string;
  readonly seasonFilter: SeasonFilter;
};

export const CourseFilterRow = (props: CourseFilterRowProps) => {
  const { t } = useLanguage();

  const seasonItems = () =>
    [
      { label: t().common.winter, value: 'winter' },
      { label: t().common.summer, value: 'summer' },
    ] as const;
  const programItems = () =>
    props.accreditation === null
      ? []
      : Array.from(getStudyPrograms(props.accreditation), (program) => ({
          description: getStudyProgramName(program, t()),
          label: STUDY_PROGRAM_LABELS[program] ?? program,
          value: program,
        }));
  const levelInfo = () =>
    interpolate(t().filters.levelInfo, {
      l1: LEVEL_CREDIT_LIMITS[1] ?? 0,
      l2: LEVEL_CREDIT_LIMITS[2] ?? 0,
    });

  return (
    <div class="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
      <Show when={!props.master}>
        <FilterGroup label={t().filters.accreditation}>
          <AccreditationSwitch
            accreditation={props.accreditation}
            onClear={
              props.clearableAccreditation
                ? () => {
                    if (props.accreditation !== null)
                      props.onSwitchAccreditation(props.accreditation);
                  }
                : undefined
            }
            onSelect={props.onSwitchAccreditation}
          />
        </FilterGroup>
      </Show>

      {props.onSwitchProgram ? (
        <FilterGroup label={t().filters.program}>
          <SegmentedControl
            class="w-full sm:w-auto"
            items={programItems()}
            onSelect={props.onSwitchProgram}
            value={props.program}
          />
        </FilterGroup>
      ) : null}

      <FilterGroup label={t().filters.season}>
        <SegmentedControl
          allLabel={t().common.all}
          class="w-full sm:w-auto"
          items={seasonItems()}
          onClear={() => {
            props.onSetSeason(null);
          }}
          onSelect={(season) => {
            props.onSetSeason(isSeasonFilter(season) ? season : null);
          }}
          value={props.seasonFilter}
        />
      </FilterGroup>

      <Show when={!props.master}>
        <FilterGroup
          info={levelInfo()}
          label={t().filters.level}
        >
          <CourseLevelFilter
            onSelect={props.onSetLevel}
            value={props.levelFilter}
          />
        </FilterGroup>
      </Show>
    </div>
  );
};
