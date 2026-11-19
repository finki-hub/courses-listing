import { type CourseStatus } from '@/lib/prerequisite';
import {
  DEFAULT_PROGRAM,
  loadStatuses,
  loadUniListCredits,
  STORAGE_KEY_ACC,
  STORAGE_KEY_HPC,
  STORAGE_KEY_PROGRAM,
} from '@/lib/simulator';
import {
  readSimulatorShareState,
  restorePlanFromShareState,
  restoreStatusesFromShareState,
  type SharedSimulatorConfig,
  type SimulatorShareState,
} from '@/lib/simulator-share';
import {
  parseSimulatorUrlState,
  type SimulatorUrlState,
} from '@/lib/simulator-url-state';
import { loadPlan, type StudyPlan } from '@/lib/study-plan';
import {
  type Accreditation,
  getStudyPrograms,
  isAccreditation,
  type SeasonFilter,
} from '@/types/course';

export type InitialSimulatorState = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  program: string;
  resolvePlan: (courses: SharedSimulatorConfig['courses']) => StudyPlan;
  resolveStatuses: (
    courses: SharedSimulatorConfig['courses'],
  ) => SharedSimulatorConfig['statuses'];
  seasonFilter: SeasonFilter;
  shared: SimulatorShareState | undefined;
  showOnlyEnabled: boolean;
  uniListCredits: number;
  view: SimulatorUrlState;
};

export type SavedSimulatorSettings = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  program: string;
  uniListCredits: number;
};

// The settings the student saved, ignoring any shared link.
export const getSavedSimulatorSettings = (): SavedSimulatorSettings => {
  const storedAcc = localStorage.getItem(STORAGE_KEY_ACC) ?? '';
  const accreditation: Accreditation = isAccreditation(storedAcc)
    ? storedAcc
    : '2023';
  return {
    accreditation,
    hpcCompleted: localStorage.getItem(STORAGE_KEY_HPC) === 'true',
    program:
      localStorage.getItem(STORAGE_KEY_PROGRAM) ??
      getStudyPrograms(accreditation)[0] ??
      DEFAULT_PROGRAM,
    uniListCredits: loadUniListCredits(),
  };
};

export const getInitialSimulatorState = (): InitialSimulatorState => {
  const sharedState = readSimulatorShareState();
  const urlState = parseSimulatorUrlState(new URL(location.href).searchParams);
  const saved = getSavedSimulatorSettings();
  const accreditation = sharedState?.accreditation ?? saved.accreditation;

  const resolveStatuses = (
    courses: SharedSimulatorConfig['courses'],
  ): Record<string, CourseStatus> =>
    sharedState
      ? restoreStatusesFromShareState(courses, sharedState)
      : loadStatuses(accreditation);

  const resolvePlan = (courses: SharedSimulatorConfig['courses']) =>
    sharedState
      ? restorePlanFromShareState(courses, sharedState)
      : loadPlan(accreditation);

  return {
    accreditation,
    hpcCompleted: sharedState?.hpcCompleted ?? saved.hpcCompleted,
    program: sharedState?.program ?? saved.program,
    resolvePlan,
    resolveStatuses,
    seasonFilter: sharedState?.seasonFilter ?? urlState.season,
    shared: sharedState,
    showOnlyEnabled: sharedState?.showOnlyEnabled ?? urlState.showOnlyEnabled,
    uniListCredits: sharedState?.uniListCredits ?? saved.uniListCredits,
    view: urlState,
  };
};
