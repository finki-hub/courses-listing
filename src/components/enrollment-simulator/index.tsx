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
  type BulkStatus,
  getBulkTargets,
  markCourses,
  type SemesterGroup,
} from '@/lib/simulator-view';
import {
  type Accreditation,
  type CourseLevelFilter,
  type CourseRaw,
  getStudyPrograms,
  type SeasonFilter,
} from '@/types/course';

import { CreditLimitWarning, GraduationAlert } from './alerts';
import { SimulatorFilters } from './simulator-filters';
import { SimulatorTable } from './simulator-table';
import { SimulatorToolbar } from './simulator-toolbar';
import { useUndoableAction } from './undo-notice';
import { useSimulatorCourses } from './use-simulator-courses';
import { useSimulatorEffects } from './use-simulator-effects';
import { getInitialSimulatorState } from './use-simulator-initial-state';
import { useSimulatorShare } from './use-simulator-share';
import { useSimulatorState } from './use-simulator-state';
import { useSimulatorView } from './use-simulator-view';

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

  const state = useSimulatorState({
    courseInfoMap,
    electiveCourses,
    hpcCompleted,
    parsedCourses,
    statuses,
    uniListCredits,
  });

  useSimulatorEffects({
    accreditation,
    enabledMap: state.enabledMap,
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

  const view = useSimulatorView({
    courses: parsedCourses,
    enabledMap: state.enabledMap,
    levelFilter,
    seasonFilter,
    showOnlyEnabled,
  });
  const undoable = useUndoableAction();

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

  const bulkMark = (group: SemesterGroup, target: BulkStatus) => {
    const names = getBulkTargets(
      group.courses,
      { enabledMap: state.enabledMap(), statuses: statuses() },
      target,
    );
    setStatuses((prev) => markCourses(prev, names, target));
  };

  const resetStatuses = () => {
    const staticSnapshot = {
      hpc: hpcCompleted(),
      statuses: statuses(),
      uniList: uniListCredits(),
    };
    setStatuses({});
    setHpcCompleted(false);
    setUniListCredits(0);
    undoable.offer(() => {
      setStatuses(staticSnapshot.statuses);
      setHpcCompleted(staticSnapshot.hpc);
      setUniListCredits(staticSnapshot.uniList);
    });
  };

  return (
    <div class="space-y-4">
      <p class="text-muted-foreground text-sm">{t().simulator.description}</p>

      <div class="space-y-2 sm:space-y-3">
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
          onToggleHpc={() => {
            setHpcCompleted((v) => !v);
          }}
          onUniListCreditsChange={setUniListCredits}
          program={program()}
          seasonFilter={seasonFilter()}
          totalCourses={state.totalCourses()}
          totalCredits={state.totalCredits()}
          uniListCredits={uniListCredits()}
        />

        <SimulatorFilters
          activeFilterCount={view.activeFilterCount()}
          onReset={resetStatuses}
          onSearch={view.setSearch}
          onSetType={view.setTypeFilter}
          onToggleOnlyEnabled={() => {
            setShowOnlyEnabled((v) => !v);
          }}
          onToggleTag={view.toggleTag}
          search={view.search()}
          showOnlyEnabled={showOnlyEnabled()}
          tags={view.tagFilter()}
          type={view.typeFilter()}
        />
      </div>

      <undoable.Notice message={t().simulator.resetDone} />

      <CreditLimitWarning
        levelLimits={LEVEL_CREDIT_LIMITS}
        levels={state.overLimitLevels()}
      />

      <Show when={state.totalCredits() >= OVERRIDE_CREDITS}>
        <div class={ALERT_STYLES.info}>{t().simulator.allUnlocked}</div>
      </Show>

      <GraduationAlert
        eligibility={state.graduationEligibility()}
        missingMandatory3yr={state.graduationInfo().missing3yr}
        missingMandatory4yr={state.graduationInfo().missing4yr}
      />

      <SimulatorTable
        enabledMap={state.enabledMap()}
        fullLevels={state.fullLevels()}
        groups={view.groups()}
        onBulkMark={bulkMark}
        onToggleListened={toggleListened}
        onTogglePassed={togglePassed}
        overLimitSet={state.overLimitSet()}
        reasonMap={state.reasonMap()}
        statuses={statuses()}
      />
    </div>
  );
};
