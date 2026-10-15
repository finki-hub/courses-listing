import { AccreditationSwitch } from '@/components/accreditation-switch';
import { CourseLevelFilter } from '@/components/course-level-filter';
import { ButtonGroup } from '@/components/ui/button-group';
import { useLanguage } from '@/lib/LanguageProvider';
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
          label: STUDY_PROGRAM_LABELS[program] ?? program,
          value: program,
        }));

  return (
    <div class="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
      <div>
        <AccreditationSwitch
          accreditation={props.accreditation}
          onSelect={props.onSwitchAccreditation}
        />
      </div>

      {props.onSwitchProgram ? (
        <div>
          <ButtonGroup
            class="w-full sm:w-auto"
            items={programItems()}
            onSelect={props.onSwitchProgram}
            value={props.program ?? undefined}
          />
        </div>
      ) : null}

      <div>
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
      </div>

      <CourseLevelFilter
        onSelect={props.onSetLevel}
        value={props.levelFilter}
      />
    </div>
  );
};
