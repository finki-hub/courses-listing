import { type CourseStatus } from '@/lib/prerequisite';
import {
  clampUniListCredits,
  type SeasonFilter,
  type SimulatorCourse,
} from '@/lib/simulator';
import { type Accreditation, getStudyPrograms } from '@/types/course';

export const SIMULATOR_SHARE_PARAM = 'sim';
export const PAGE_QUERY_PARAM = 'page';

const SHARE_STATE_VERSION = '1';
const SHARE_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export type SharedSimulatorConfig = {
  accreditation: Accreditation;
  courses: SimulatorCourse[];
  hpcCompleted: boolean;
  program: string;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  statuses: Record<string, CourseStatus>;
  uniListCredits: number;
};

export type SimulatorShareState = {
  accreditation: Accreditation;
  encodedStatuses: string;
  hpcCompleted: boolean;
  program: string;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  uniListCredits: number;
};

const SEASON_CODES: Record<'none' | 'summer' | 'winter', number> = {
  none: 0,
  summer: 2,
  winter: 1,
};

const getAccreditationCode = (accreditation: Accreditation): '18' | '23' =>
  accreditation === '2018' ? '18' : '23';

const parseAccreditationCode = (value: string): Accreditation | undefined => {
  if (value === '18') return '2018';
  if (value === '23') return '2023';
  return undefined;
};

const encodeAlphabetValue = (value: number): string =>
  SHARE_ALPHABET[value] ?? '';

const decodeAlphabetValue = (value: string): number =>
  SHARE_ALPHABET.indexOf(value);

const sanitizeProgram = (
  accreditation: Accreditation,
  program: string,
): string => {
  const allowed = getStudyPrograms(accreditation);
  return allowed.includes(program) ? program : (allowed[0] ?? program);
};

const encodeSettings = (config: {
  hpcCompleted: boolean;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
}): string => {
  const seasonCode =
    config.seasonFilter === 'winter'
      ? SEASON_CODES.winter
      : config.seasonFilter === 'summer'
        ? SEASON_CODES.summer
        : SEASON_CODES.none;

  const value =
    seasonCode +
    (config.hpcCompleted ? 4 : 0) +
    (config.showOnlyEnabled ? 8 : 0);

  return encodeAlphabetValue(value);
};

const decodeSettings = (
  value: string,
):
  | Omit<
      SimulatorShareState,
      'accreditation' | 'encodedStatuses' | 'program' | 'uniListCredits'
    >
  | undefined => {
  const decoded = decodeAlphabetValue(value);
  if (decoded < 0) return undefined;

  const seasonCode = decoded % 4;
  const seasonFilter =
    seasonCode === SEASON_CODES.winter
      ? 'winter'
      : seasonCode === SEASON_CODES.summer
        ? 'summer'
        : seasonCode === SEASON_CODES.none
          ? null
          : undefined;

  if (seasonFilter === undefined) return undefined;

  return {
    hpcCompleted: Math.trunc(decoded / 4) % 2 === 1,
    seasonFilter,
    showOnlyEnabled: Math.trunc(decoded / 8) % 2 === 1,
  };
};

const encodeCourseStatus = (status: CourseStatus | undefined): number => {
  if (status?.passed) return 2;
  if (status?.listened) return 1;
  return 0;
};

const decodeCourseStatus = (value: number): CourseStatus | undefined => {
  if (value === 0) return undefined;
  if (value === 1) return { listened: true, passed: false };
  if (value === 2) return { listened: true, passed: true };
  return undefined;
};

const encodeStatuses = (
  courses: SimulatorCourse[],
  statuses: Record<string, CourseStatus>,
): string => {
  let encoded = '';

  for (let index = 0; index < courses.length; index += 3) {
    const first = encodeCourseStatus(statuses[courses[index]?.name ?? '']);
    const second = encodeCourseStatus(statuses[courses[index + 1]?.name ?? '']);
    const third = encodeCourseStatus(statuses[courses[index + 2]?.name ?? '']);
    encoded += encodeAlphabetValue(first + second * 4 + third * 16);
  }

  return encoded;
};

const decodeStatuses = (
  courses: SimulatorCourse[],
  encodedStatuses: string,
): Record<string, CourseStatus> | undefined => {
  const statuses: Record<string, CourseStatus> = {};
  let courseIndex = 0;

  for (const char of encodedStatuses) {
    const packed = decodeAlphabetValue(char);
    if (packed < 0) return undefined;

    for (
      let offset = 0;
      offset < 3 && courseIndex < courses.length;
      offset += 1
    ) {
      const status = decodeCourseStatus(Math.trunc(packed / 4 ** offset) % 4);
      const course = courses[courseIndex];
      if (status && course) {
        statuses[course.name] = status;
      }
      courseIndex += 1;
    }
  }

  return statuses;
};

export const readSimulatorShareState = (): SimulatorShareState | undefined => {
  const raw = new URL(window.location.href).searchParams.get(
    SIMULATOR_SHARE_PARAM,
  );
  if (!raw) return undefined;

  const [
    version,
    accreditationCode,
    program,
    settings,
    uniListCredits,
    encodedStatuses = '',
  ] = raw.split('.');

  if (
    version !== SHARE_STATE_VERSION ||
    !accreditationCode ||
    !program ||
    !settings ||
    !uniListCredits
  ) {
    return undefined;
  }

  const accreditation = parseAccreditationCode(accreditationCode);
  if (!accreditation) return undefined;

  const decodedSettings = decodeSettings(settings);
  if (!decodedSettings) return undefined;

  const decodedUniListCredits = decodeAlphabetValue(uniListCredits);
  if (decodedUniListCredits < 0) return undefined;

  return {
    accreditation,
    encodedStatuses,
    hpcCompleted: decodedSettings.hpcCompleted,
    program: sanitizeProgram(accreditation, program),
    seasonFilter: decodedSettings.seasonFilter,
    showOnlyEnabled: decodedSettings.showOnlyEnabled,
    uniListCredits: clampUniListCredits(decodedUniListCredits),
  };
};

export const getSimulatorShareUrl = (config: SharedSimulatorConfig): string => {
  const url = new URL(window.location.href);
  const encodedSettings = encodeSettings(config);
  const encodedUniListCredits = encodeAlphabetValue(
    clampUniListCredits(config.uniListCredits),
  );
  const encodedStatuses = encodeStatuses(config.courses, config.statuses);

  url.searchParams.set(PAGE_QUERY_PARAM, 'simulator');
  url.searchParams.set(
    SIMULATOR_SHARE_PARAM,
    [
      SHARE_STATE_VERSION,
      getAccreditationCode(config.accreditation),
      sanitizeProgram(config.accreditation, config.program),
      encodedSettings,
      encodedUniListCredits,
      encodedStatuses,
    ].join('.'),
  );
  return url.toString();
};

export const replaceSimulatorShareUrl = (
  config: SharedSimulatorConfig,
): void => {
  window.history.replaceState({}, '', getSimulatorShareUrl(config));
};

export const restoreStatusesFromShareState = (
  courses: SimulatorCourse[],
  sharedState: SimulatorShareState,
): Record<string, CourseStatus> =>
  decodeStatuses(courses, sharedState.encodedStatuses) ?? {};
