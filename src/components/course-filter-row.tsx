import { AccreditationSwitch } from '@/components/accreditation-switch';
import { CourseLevelFilter } from '@/components/course-level-filter';
import { FilterGroup } from '@/components/filter-group';
import { ButtonGroup } from '@/components/ui/button-group';
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
  readonly levelFilter: CourseLevelFilterValue;
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
      <FilterGroup label={t().filters.accreditation}>
        <AccreditationSwitch
          accreditation={props.accreditation}
          onSelect={props.onSwitchAccreditation}
        />
      </FilterGroup>

      {props.onSwitchProgram ? (
        <FilterGroup label={t().filters.program}>
          <ButtonGroup
            class="w-full sm:w-auto"
            items={programItems()}
            onSelect={props.onSwitchProgram}
            value={props.program ?? undefined}
          />
        </FilterGroup>
      ) : null}

      <FilterGroup label={t().filters.season}>
        <ButtonGroup
          class="w-full sm:w-auto"
          items={seasonItems()}
          onSelect={(season) => {
            props.onSetSeason(
              props.seasonFilter === season || !isSeasonFilter(season)
                ? null
                : season,
            );
          }}
          value={props.seasonFilter ?? ''}
        />
      </FilterGroup>

      <FilterGroup
        info={levelInfo()}
        label={t().filters.level}
      >
        <CourseLevelFilter
          onSelect={props.onSetLevel}
          value={props.levelFilter}
        />
      </FilterGroup>
    </div>
  );
};
