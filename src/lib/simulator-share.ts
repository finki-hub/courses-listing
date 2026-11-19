import { replaceUrlParams } from '@/lib/listing-url-state';
import { type CourseStatus } from '@/lib/prerequisite';
import { clampUniListCredits, type SimulatorCourse } from '@/lib/simulator';
import { SIMULATOR_VIEW_PARAMS } from '@/lib/simulator-url-state';
import { LAST_SEMESTER, type StudyPlan } from '@/lib/study-plan';
import {
  type Accreditation,
  getStudyPrograms,
  type SeasonFilter,
} from '@/types/course';

export const SIMULATOR_SHARE_PARAM = 'sim';
export const PAGE_QUERY_PARAM = 'page';

// Version 2 adds the study plan; version 1 links still open, without a plan.
const SHARE_STATE_VERSION = '2';
const SUPPORTED_SHARE_VERSIONS: ReadonlySet<string> = new Set(['1', '2']);
const SHARE_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export type SharedSimulatorConfig = {
  accreditation: Accreditation;
  courses: SimulatorCourse[];
  hpcCompleted: boolean;
  plan: StudyPlan;
  program: string;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  statuses: Record<string, CourseStatus>;
  uniListCredits: number;
};

export type SimulatorShareState = {
  accreditation: Accreditation;
  encodedPlan: string;
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

const SETTINGS_HPC_FLAG = 4;
const SETTINGS_SHOW_ONLY_FLAG = 8;
const SEASON_CODE_MODULUS = 4;

const STATUS_GROUP_SIZE = 3;
const STATUS_BASE = 4;
const STATUS_BASE_SQUARED = STATUS_BASE * STATUS_BASE;

const ACCREDITATION_TO_CODE: Record<Accreditation, string> = {
  '2018': '18',
  '2023': '23',
};

const CODE_TO_ACCREDITATION: Record<string, Accreditation> = {
  '18': '2018',
  '23': '2023',
};

const getAccreditationCode = (accreditation: Accreditation): string =>
  ACCREDITATION_TO_CODE[accreditation];

const parseAccreditationCode = (value: string): Accreditation | undefined =>
  CODE_TO_ACCREDITATION[value];

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
  const seasonCode = SEASON_CODES[config.seasonFilter ?? 'none'];

  const value =
    seasonCode +
    (config.hpcCompleted ? SETTINGS_HPC_FLAG : 0) +
    (config.showOnlyEnabled ? SETTINGS_SHOW_ONLY_FLAG : 0);

  return encodeAlphabetValue(value);
};

const decodeSettings = (
  value: string,
):
  | Omit<
      SimulatorShareState,
      | 'accreditation'
      | 'encodedPlan'
      | 'encodedStatuses'
      | 'program'
      | 'uniListCredits'
    >
  | undefined => {
  const decoded = decodeAlphabetValue(value);
  if (decoded < 0) return undefined;

  const seasonCode = decoded % SEASON_CODE_MODULUS;
  let seasonFilter: SeasonFilter | undefined;
  switch (seasonCode) {
    case SEASON_CODES.none:
      seasonFilter = null;
      break;
    case SEASON_CODES.summer:
      seasonFilter = 'summer';
      break;
    case SEASON_CODES.winter:
      seasonFilter = 'winter';
      break;
    default:
      break;
  }

  if (seasonFilter === undefined) return undefined;

  return {
    hpcCompleted: Math.trunc(decoded / SETTINGS_HPC_FLAG) % 2 === 1,
    seasonFilter,
    showOnlyEnabled: Math.trunc(decoded / SETTINGS_SHOW_ONLY_FLAG) % 2 === 1,
  };
};

const encodeCourseStatus = (status: CourseStatus | undefined): number => {
  if (status?.passed) return 2;
  return status?.listened ? 1 : 0;
};

const decodeCourseStatus = (value: number): CourseStatus | undefined => {
  switch (value) {
    case 1:
      return { listened: true, passed: false };
    case 2:
      return { listened: true, passed: true };
    default:
      return undefined;
  }
};

const encodeStatuses = (
  courses: SimulatorCourse[],
  statuses: Record<string, CourseStatus>,
): string => {
  let encoded = '';

  for (let index = 0; index < courses.length; index += STATUS_GROUP_SIZE) {
    const first = encodeCourseStatus(statuses[courses[index]?.name ?? '']);
    const second = encodeCourseStatus(statuses[courses[index + 1]?.name ?? '']);
    const third = encodeCourseStatus(statuses[courses[index + 2]?.name ?? '']);
    encoded += encodeAlphabetValue(
      first + second * STATUS_BASE + third * STATUS_BASE_SQUARED,
    );
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
      offset < STATUS_GROUP_SIZE && courseIndex < courses.length;
      offset += 1
    ) {
      const status = decodeCourseStatus(
        Math.trunc(packed / STATUS_BASE ** offset) % STATUS_BASE,
      );
      const course = courses[courseIndex];
      if (status && course) {
        statuses[course.name] = status;
      }
      courseIndex += 1;
    }
  }

  return statuses;
};

const ALPHABET_SIZE = SHARE_ALPHABET.length;

// Each planned course takes two characters: its position in the course list
// and its semester, packed as position * 8 + semester - 1.
const encodePlan = (courses: SimulatorCourse[], plan: StudyPlan): string =>
  courses
    .map((course, index) => {
      const semester = plan[course.name];
      if (semester === undefined) return '';
      const value = index * LAST_SEMESTER + semester - 1;
      return (
        encodeAlphabetValue(Math.trunc(value / ALPHABET_SIZE)) +
        encodeAlphabetValue(value % ALPHABET_SIZE)
      );
    })
    .join('');

const decodePlan = (
  courses: SimulatorCourse[],
  encodedPlan: string,
): StudyPlan => {
  const plan: StudyPlan = {};
  for (let offset = 0; offset + 1 < encodedPlan.length; offset += 2) {
    const high = decodeAlphabetValue(encodedPlan.charAt(offset));
    const low = decodeAlphabetValue(encodedPlan.charAt(offset + 1));
    if (high < 0 || low < 0) return {};
    const value = high * ALPHABET_SIZE + low;
    const course = courses[Math.trunc(value / LAST_SEMESTER)];
    if (course) plan[course.name] = (value % LAST_SEMESTER) + 1;
  }
  return plan;
};

export const readSimulatorShareState = (): SimulatorShareState | undefined => {
  const raw = new URL(location.href).searchParams.get(SIMULATOR_SHARE_PARAM);
  if (!raw) return undefined;

  const [
    version,
    accreditationCode,
    program,
    settings,
    uniListCredits,
    encodedStatuses = '',
    encodedPlan = '',
  ] = raw.split('.', 7);

  if (
    !accreditationCode ||
    !program ||
    !settings ||
    !uniListCredits ||
    !SUPPORTED_SHARE_VERSIONS.has(version ?? '')
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
    encodedPlan: version === '1' ? '' : encodedPlan,
    encodedStatuses,
    hpcCompleted: decodedSettings.hpcCompleted,
    program: sanitizeProgram(accreditation, program),
    seasonFilter: decodedSettings.seasonFilter,
    showOnlyEnabled: decodedSettings.showOnlyEnabled,
    uniListCredits: clampUniListCredits(decodedUniListCredits),
  };
};

export const getSimulatorShareUrl = (config: SharedSimulatorConfig): string => {
  const url = new URL(location.href);
  const encodedSettings = encodeSettings(config);
  const encodedUniListCredits = encodeAlphabetValue(
    clampUniListCredits(config.uniListCredits),
  );
  const encodedStatuses = encodeStatuses(config.courses, config.statuses);

  // The sharer's own search and filters stay out of the link.
  for (const param of SIMULATOR_VIEW_PARAMS) url.searchParams.delete(param);
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
      encodePlan(config.courses, config.plan),
    ].join('.'),
  );
  return url.href;
};

export const restoreStatusesFromShareState = (
  courses: SimulatorCourse[],
  sharedState: SimulatorShareState,
): Record<string, CourseStatus> =>
  decodeStatuses(courses, sharedState.encodedStatuses) ?? {};

export const restorePlanFromShareState = (
  courses: SimulatorCourse[],
  sharedState: SimulatorShareState,
): StudyPlan => decodePlan(courses, sharedState.encodedPlan);

// Each course with a status, mapped to its share code; cleared ones are left out.
const statusCodes = (
  statuses: Record<string, CourseStatus>,
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(statuses)
      .map(([name, status]) => [name, encodeCourseStatus(status)] as const)
      .filter(([, code]) => code !== 0),
  );

const sameEntries = (
  first: Record<string, number>,
  second: Record<string, number>,
): boolean => {
  const keys = Object.keys(first);
  return (
    keys.length === Object.keys(second).length &&
    keys.every((key) => first[key] === second[key])
  );
};

// Drops the shared state from the URL once it has been kept or left.
export const clearSimulatorShareParam = (): void => {
  replaceUrlParams((params) => {
    params.delete(SIMULATOR_SHARE_PARAM);
  });
};

/**
 * Whether opening a shared state would replace progress the student saved,
 * so it should be previewed instead of taken over.
 *
 * @param courses - The shared accreditation's simulator courses
 * @param sharedState - The decoded shared link
 * @param saved - The student's saved statuses and plan for that accreditation
 * @param saved.plan - The saved study plan
 * @param saved.statuses - The saved course statuses
 * @returns True when there is saved progress that differs from the link
 */
export const sharedStateConflicts = (
  courses: SimulatorCourse[],
  sharedState: SimulatorShareState,
  saved: { plan: StudyPlan; statuses: Record<string, CourseStatus> },
): boolean => {
  const savedStatuses = statusCodes(saved.statuses);
  const hasSavedProgress =
    Object.keys(savedStatuses).length > 0 || Object.keys(saved.plan).length > 0;
  return (
    hasSavedProgress &&
    !(
      sameEntries(
        savedStatuses,
        statusCodes(restoreStatusesFromShareState(courses, sharedState)),
      ) &&
      sameEntries(saved.plan, restorePlanFromShareState(courses, sharedState))
    )
  );
};
