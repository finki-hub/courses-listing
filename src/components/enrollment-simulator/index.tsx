import { createSignal, Show } from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { useLanguage } from '@/lib/LanguageProvider';
import { OVERRIDE_CREDITS } from '@/lib/prerequisite';
import {
  DEFAULT_PROGRAM,
  LEVEL_CREDIT_LIMITS,
  loadStatuses,
  toggleListenedStatus,
  togglePassedStatus,
} from '@/lib/simulator';
import {
  type Accreditation,
  type CourseLevelFilter,
  type CourseRaw,
  getStudyPrograms,
  type SeasonFilter,
} from '@/types/course';

import { CreditLimitWarning, GraduationAlert } from './alerts';
import { SimulatorTable } from './simulator-table';
import { SimulatorToolbar } from './simulator-toolbar';
import { useSimulatorCourses } from './use-simulator-courses';
import { useSimulatorEffects } from './use-simulator-effects';
import { getInitialSimulatorState } from './use-simulator-initial-state';
import { useSimulatorShare } from './use-simulator-share';
import { useSimulatorState } from './use-simulator-state';

type EnrollmentSimulatorProps = {
  courses: CourseRaw[];
};

export const EnrollmentSimulator = (props: EnrollmentSimulatorProps) => {
  const { t } = useLanguage();

  const initialState = getInitialSimulatorState();

  const [accreditation, setAccreditation] = createSignal<Accreditation>(
    initialState.accreditation,
  );
  const [program, setProgram] = createSignal(initialState.program);
  const [showOnlyEnabled, setShowOnlyEnabled] = createSignal(
    initialState.showOnlyEnabled,
  );
  const [seasonFilter, setSeasonFilter] = createSignal<SeasonFilter>(
    initialState.seasonFilter,
  );
  const [levelFilter, setLevelFilter] = createSignal<CourseLevelFilter>(null);
  const [hpcCompleted, setHpcCompleted] = createSignal(
    initialState.hpcCompleted,
  );
  const [uniListCredits, setUniListCredits] = createSignal(
    initialState.uniListCredits,
  );

  const { courseInfoMap, electiveCourses, parsedCourses } = useSimulatorCourses(
    () => props.courses,
    accreditation,
    program,
  );

  const [statuses, setStatuses] = createSignal(
    initialState.resolveStatuses(parsedCourses()),
  );

  const {
    enabledMap,
    fullLevels,
    graduationEligibility,
    graduationInfo,
    overLimitLevels,
    overLimitSet,
    reasonMap,
    totalCourses,
    totalCredits,
  } = useSimulatorState({
    courseInfoMap,
    electiveCourses,
    hpcCompleted,
    parsedCourses,
    statuses,
    uniListCredits,
  });

  useSimulatorEffects({
    accreditation,
    enabledMap,
    hpcCompleted,
    parsedCourses,
    program,
    setStatuses,
    setUniListCredits,
    statuses,
    uniListCredits,
  });

  const { copyShareUrl } = useSimulatorShare({
    accreditation,
    courses: parsedCourses,
    hpcCompleted,
    program,
    seasonFilter,
    showOnlyEnabled,
    statuses,
    uniListCredits,
  });

  const switchAccreditation = (acc: Accreditation) => {
    setAccreditation(acc);
    setProgram(getStudyPrograms(acc)[0] ?? DEFAULT_PROGRAM);
    setStatuses(loadStatuses(acc));
  };

  const toggleListened = (name: string) => {
    setStatuses((prev) => toggleListenedStatus(prev, name));
  };

  const togglePassed = (name: string) => {
    setStatuses((prev) => togglePassedStatus(prev, name));
  };

  const resetStatuses = () => {
    if (
      // eslint-disable-next-line no-alert -- Keep the existing reset confirmation.
      !confirm(t().simulator.resetConfirm)
    )
      return;
    setStatuses({});
    setHpcCompleted(false);
    setUniListCredits(0);
  };

  return (
    <div class="space-y-4">
      <p class="text-muted-foreground text-sm">{t().simulator.description}</p>

      <SimulatorToolbar
        accreditation={accreditation()}
        hpcCompleted={hpcCompleted()}
        levelFilter={levelFilter()}
        onReset={resetStatuses}
        onSetLevel={setLevelFilter}
        onSetSeason={setSeasonFilter}
        onShare={copyShareUrl}
        onSwitchAccreditation={switchAccreditation}
        onSwitchProgram={setProgram}
        onToggleFilter={() => {
          setShowOnlyEnabled((v) => !v);
        }}
        onToggleHpc={() => {
          setHpcCompleted((v) => !v);
        }}
        onUniListCreditsChange={setUniListCredits}
        program={program()}
        seasonFilter={seasonFilter()}
        showOnlyEnabled={showOnlyEnabled()}
        totalCourses={totalCourses()}
        totalCredits={totalCredits()}
        uniListCredits={uniListCredits()}
      />

      <CreditLimitWarning
        levelLimits={LEVEL_CREDIT_LIMITS}
        levels={overLimitLevels()}
      />

      <Show when={totalCredits() >= OVERRIDE_CREDITS}>
        <div class={ALERT_STYLES.info}>{t().simulator.allUnlocked}</div>
      </Show>

      <GraduationAlert
        eligibility={graduationEligibility()}
        missingMandatory3yr={graduationInfo().missing3yr}
        missingMandatory4yr={graduationInfo().missing4yr}
      />

      <SimulatorTable
        courses={parsedCourses()}
        enabledMap={enabledMap()}
        fullLevels={fullLevels()}
        levelFilter={levelFilter()}
        onToggleListened={toggleListened}
        onTogglePassed={togglePassed}
        overLimitSet={overLimitSet()}
        reasonMap={reasonMap()}
        seasonFilter={seasonFilter()}
        showOnlyEnabled={showOnlyEnabled()}
        statuses={statuses()}
      />
    </div>
  );
};
