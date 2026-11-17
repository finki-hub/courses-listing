import { createSignal, Show } from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { useLanguage } from '@/lib/LanguageProvider';
import { OVERRIDE_CREDITS } from '@/lib/prerequisite';
import {
  DEFAULT_PROGRAM,
  LEVEL_CREDIT_LIMITS,
  loadStatuses,
} from '@/lib/simulator';
import {
  type Accreditation,
  type CourseLevelFilter,
  type CourseRaw,
  getStudyPrograms,
  type SeasonFilter,
} from '@/types/course';

import { CreditLimitWarning, GraduationAlert } from './alerts';
import { NextCoursesPanel } from './next-courses-panel';
import { SimulatorFilters } from './simulator-filters';
import {
  type SimulatorMode,
  SimulatorModeSwitch,
} from './simulator-mode-switch';
import { SimulatorTable } from './simulator-table';
import { SimulatorToolbar } from './simulator-toolbar';
import { useNextCourses } from './use-next-courses';
import { useSimulatorActions } from './use-simulator-actions';
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
  const actions = useSimulatorActions({
    enabledMap: state.enabledMap,
    hpcCompleted,
    setHpcCompleted,
    setStatuses,
    setUniListCredits,
    statuses,
    uniListCredits,
  });
  const next = useNextCourses({
    courses: parsedCourses,
    enabledMap: state.enabledMap,
    fullLevels: state.fullLevels,
    levelFilter,
    seasonFilter,
    statuses,
  });
  const [mode, setMode] = createSignal<SimulatorMode>('checklist');

  const switchAccreditation = (acc: Accreditation) => {
    setAccreditation(acc);
    setProgram(getStudyPrograms(acc)[0] ?? DEFAULT_PROGRAM);
    setStatuses(loadStatuses(acc));
  };

  return (
    <div class="space-y-4">
      <SimulatorModeSwitch
        description={
          mode() === 'checklist'
            ? t().simulator.description
            : t().nextCourses.description
        }
        mode={mode()}
        onSelect={setMode}
      />

      <div class="space-y-2 sm:space-y-3">
        <SimulatorToolbar
          accreditation={accreditation()}
          hpcCompleted={hpcCompleted()}
          levelFilter={levelFilter()}
          onReset={actions.reset}
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

        <Show when={mode() === 'checklist'}>
          <SimulatorFilters
            activeFilterCount={view.activeFilterCount()}
            onReset={actions.reset}
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
        </Show>
      </div>

      <actions.UndoNotice message={t().simulator.resetDone} />

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

      <Show
        fallback={
          <NextCoursesPanel
            isUpcoming={next.isUpcoming()}
            items={next.ranked().items}
            onMarkListened={actions.toggleListened}
            season={next.season()}
            year={next.ranked().year}
          />
        }
        when={mode() === 'checklist'}
      >
        <SimulatorTable
          enabledMap={state.enabledMap()}
          fullLevels={state.fullLevels()}
          groups={view.groups()}
          onBulkMark={actions.bulkMark}
          onToggleListened={actions.toggleListened}
          onTogglePassed={actions.togglePassed}
          overLimitSet={state.overLimitSet()}
          reasonMap={state.reasonMap()}
          statuses={statuses()}
        />
      </Show>
    </div>
  );
};
