import { type CourseStatus } from '@/lib/prerequisite';
import {
  loadStatuses,
  loadUniListCredits,
  type SeasonFilter,
  STORAGE_KEY_ACC,
  STORAGE_KEY_HPC,
  STORAGE_KEY_PROGRAM,
} from '@/lib/simulator';
import {
  readSimulatorShareState,
  restoreStatusesFromShareState,
  type SharedSimulatorConfig,
} from '@/lib/simulator-share';
import {
  type Accreditation,
  getStudyPrograms,
  isAccreditation,
} from '@/types/course';

const DEFAULT_PROGRAM = 'kn';

export type InitialSimulatorState = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  program: string;
  resolveStatuses: (
    courses: SharedSimulatorConfig['courses'],
  ) => SharedSimulatorConfig['statuses'];
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  uniListCredits: number;
};

export const getInitialSimulatorState = (): InitialSimulatorState => {
  const sharedState = readSimulatorShareState();
  const storedAcc = localStorage.getItem(STORAGE_KEY_ACC) ?? '';
  const savedAcc: Accreditation = isAccreditation(storedAcc)
    ? storedAcc
    : '2023';
  const accreditation = sharedState?.accreditation ?? savedAcc;
  const defaultPrograms = getStudyPrograms(accreditation);
  const program =
    sharedState?.program ??
    localStorage.getItem(STORAGE_KEY_PROGRAM) ??
    defaultPrograms[0] ??
    DEFAULT_PROGRAM;

  const resolveStatuses = (
    courses: SharedSimulatorConfig['courses'],
  ): Record<string, CourseStatus> =>
    sharedState
      ? restoreStatusesFromShareState(courses, sharedState)
      : loadStatuses(accreditation);

  return {
    accreditation,
    hpcCompleted:
      sharedState?.hpcCompleted ??
      localStorage.getItem(STORAGE_KEY_HPC) === 'true',
    program,
    resolveStatuses,
    seasonFilter: sharedState?.seasonFilter ?? null,
    showOnlyEnabled: sharedState?.showOnlyEnabled ?? false,
    uniListCredits: sharedState?.uniListCredits ?? loadUniListCredits(),
  };
};
