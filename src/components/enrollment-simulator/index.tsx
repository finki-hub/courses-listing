/* eslint-disable no-alert */
import { createEffect, createSignal, on, Show } from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { type CourseStatus, OVERRIDE_CREDITS } from '@/lib/prerequisite';
import { captureTableToClipboard } from '@/lib/screenshot';
import {
  LEVEL_CREDIT_LIMITS,
  loadStatuses,
  loadUniListCredits,
  type SeasonFilter,
  STORAGE_KEY_ACC,
  STORAGE_KEY_HPC,
  STORAGE_KEY_PROGRAM,
  toggleListenedStatus,
  togglePassedStatus,
} from '@/lib/simulator';
import {
  type Accreditation,
  type CourseRaw,
  getStudyPrograms,
  isAccreditation,
} from '@/types/course';

import { CreditLimitWarning, GraduationAlert } from './alerts';
import { SimulatorTable } from './simulator-table';
import { SimulatorToolbar } from './simulator-toolbar';
import { useSimulatorCourses } from './use-simulator-courses';
import { useSimulatorEffects } from './use-simulator-effects';
import { useSimulatorState } from './use-simulator-state';

const DEFAULT_PROGRAM = 'kn';

type EnrollmentSimulatorProps = {
  courses: CourseRaw[];
};

export const EnrollmentSimulator = (props: EnrollmentSimulatorProps) => {
  const storedAcc = localStorage.getItem(STORAGE_KEY_ACC) ?? '';
  const savedAcc: Accreditation = isAccreditation(storedAcc)
    ? storedAcc
    : '2023';
  const defaultPrograms = getStudyPrograms(savedAcc);
  const savedProgram =
    localStorage.getItem(STORAGE_KEY_PROGRAM) ??
    defaultPrograms[0] ??
    DEFAULT_PROGRAM;

  const [accreditation, setAccreditation] =
    createSignal<Accreditation>(savedAcc);
  const [program, setProgram] = createSignal<string>(savedProgram);
  const [statuses, setStatuses] = createSignal<Record<string, CourseStatus>>(
    loadStatuses(savedAcc),
  );

  const [showOnlyEnabled, setShowOnlyEnabled] = createSignal(false);
  const [seasonFilter, setSeasonFilter] = createSignal<SeasonFilter>(null);
  const [hpcCompleted, setHpcCompleted] = createSignal(
    localStorage.getItem(STORAGE_KEY_HPC) === 'true',
  );
  const [uniListCredits, setUniListCredits] =
    createSignal(loadUniListCredits());

  const { courseInfoMap, electiveCourses, parsedCourses } = useSimulatorCourses(
    () => props.courses,
    accreditation,
    program,
  );

  createEffect(
    on(hpcCompleted, (v) => {
      localStorage.setItem(STORAGE_KEY_HPC, String(v));
    }),
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
    parsedCourses,
    program,
    setStatuses,
    setUniListCredits,
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
      !window.confirm(
        'Дали сте сигурни дека сакате да ги ресетирате сите избрани предмети?',
      )
    )
      return;
    setStatuses({});
    setHpcCompleted(false);
    setUniListCredits(0);
  };

  let tableRef: HTMLDivElement | undefined;

  return (
    <div class="space-y-4">
      <p class="text-muted-foreground text-sm">
        Означете ги предметите кои сте ги слушале или положиле. Предметите за
        кои не се исполнети предусловите се оневозможени.
      </p>

      <SimulatorToolbar
        accreditation={accreditation()}
        hpcCompleted={hpcCompleted()}
        onReset={resetStatuses}
        onScreenshot={() =>
          tableRef ? captureTableToClipboard(tableRef) : Promise.resolve(false)
        }
        onSetSeason={setSeasonFilter}
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
        <div class={ALERT_STYLES.info}>
          🔓 Имате ≥ 180 кредити — сите предмети се отклучени
        </div>
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
        onToggleListened={toggleListened}
        onTogglePassed={togglePassed}
        overLimitSet={overLimitSet()}
        reasonMap={reasonMap()}
        ref={(el) => {
          tableRef = el;
        }}
        seasonFilter={seasonFilter()}
        showOnlyEnabled={showOnlyEnabled()}
        statuses={statuses()}
      />
    </div>
  );
};
