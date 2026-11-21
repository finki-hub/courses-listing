import type { Language } from '@/lib/i18n';

import {
  type EnrollmentYears,
  getCourseSemester,
  getCourseStaff,
  getCurrentEnrollment,
  getPrimaryCredits,
  isInactiveCourse,
  type SeasonResolver,
} from '@/lib/course-facts';
import { getCourseLinkValue } from '@/lib/listing-url-state';
import {
  matchesNormalizedTerm,
  normalizeSearchText,
} from '@/lib/search-normalization';
import { getProgramStateKind } from '@/lib/simulator';
import {
  type Accreditation,
  type CourseLevelFilter,
  type CourseRaw,
  getAccLabel,
  getAccreditationInfo,
  getCourseCredits,
  getCourseName,
  getCourseStateForProgram,
  getCourseTags,
  hasChannel,
  type SeasonFilter,
} from '@/types/course';

export type SortColumn =
  | 'accreditation'
  | 'channel'
  | 'credits'
  | 'name'
  | 'popularity'
  | 'semester'
  | 'tags';

export type SortDirection = 'asc' | 'desc';

export const SORT_COLUMNS: SortColumn[] = [
  'name',
  'accreditation',
  'channel',
  'tags',
  'semester',
  'popularity',
];

// Master's courses have no semesters, accreditations or tags to sort by.
export const MASTER_SORT_COLUMNS: SortColumn[] = [
  'name',
  'popularity',
  'channel',
];

// The direction a column sorts in when first chosen: most popular first.
export const getDefaultSortDirection = (column: SortColumn): SortDirection =>
  column === 'popularity' ? 'desc' : 'asc';

export type CourseFilterCriteria = {
  readonly accreditation: Accreditation | null;
  readonly channelOnly?: boolean;
  readonly credits?: null | number;
  readonly enrollmentYears?: EnrollmentYears;
  readonly getSeason?: SeasonResolver;
  readonly hideInactive?: boolean;
  readonly level: CourseLevelFilter;
  /** Replaces the accreditation-based curriculum filters (master's view). */
  readonly matchesCurriculum?: (course: CourseRaw) => boolean;
  readonly offeredOnly?: boolean;
  readonly program?: null | string;
  /** Without a program state, a program matches its required and electives. */
  readonly programState?: ProgramStateFilter;
  /** When set, only the courses with these link values match. */
  readonly savedValues?: ReadonlySet<string>;
  readonly searchTerm: string;
  readonly season: SeasonFilter;
  readonly semester?: null | number;
  readonly staff?: string;
  readonly tagMode?: TagMode;
  readonly tags: ReadonlySet<string>;
};

export type ProgramStateFilter = 'elective' | 'required' | null;

export type TagMode = 'all' | 'any';

const matchesProgramState = (
  programState: string | undefined,
  filter: ProgramStateFilter,
): boolean => {
  const kind = getProgramStateKind(programState);
  if (kind === undefined) return false;
  if (filter === 'required')
    return kind === 'required' || kind === 'required-4yr';
  if (filter === 'elective') return kind === 'elective';
  return kind !== 'faculty-list';
};

const hasCurriculumCriteria = (criteria: CourseFilterCriteria): boolean =>
  [
    criteria.accreditation,
    criteria.level,
    criteria.season,
    criteria.semester,
    criteria.credits,
    criteria.program,
  ].some((value) => value !== null && value !== undefined);

// Curriculum filters must all hold within a single accreditation.
const matchesAccreditation = (
  course: CourseRaw,
  accreditation: Accreditation,
  criteria: CourseFilterCriteria,
): boolean => {
  const info = getAccreditationInfo(course, accreditation);
  if (!info) return false;

  const semester = Number.parseInt(info.semester ?? '', 10);
  const level = criteria.level;
  const season = criteria.season;
  const wantedSemester = criteria.semester ?? null;
  const credits = criteria.credits ?? null;
  const program = criteria.program ?? null;

  return (
    (level === null || info.level === String(level)) &&
    // An unknown semester (NaN) belongs to neither season.
    (season === null ||
      (!Number.isNaN(semester) &&
        (season === 'winter') === (semester % 2 === 1))) &&
    (wantedSemester === null || semester === wantedSemester) &&
    (credits === null || getCourseCredits(course, accreditation) === credits) &&
    (program === null ||
      matchesProgramState(
        getCourseStateForProgram(course, accreditation, program),
        criteria.programState ?? null,
      ))
  );
};

const matchesCurriculumFilters = (
  course: CourseRaw,
  criteria: CourseFilterCriteria,
): boolean => {
  if (!hasCurriculumCriteria(criteria)) return true;

  const accreditations: readonly Accreditation[] =
    criteria.accreditation === null
      ? ['2023', '2018']
      : [criteria.accreditation];

  return accreditations.some((accreditation) =>
    matchesAccreditation(course, accreditation, criteria),
  );
};

const matchesTags = (
  course: CourseRaw,
  criteria: CourseFilterCriteria,
): boolean => {
  if (criteria.tags.size === 0) return true;
  const courseTags = getCourseTags(course);
  const selected = [...criteria.tags];
  return criteria.tagMode === 'all'
    ? selected.every((tag) => courseTags.includes(tag))
    : selected.some((tag) => courseTags.includes(tag));
};

// Staff match like search: any part of a name, in Cyrillic or Latin.
const matchesStaff = (course: CourseRaw, staff: string): boolean => {
  const term = normalizeSearchText(staff);
  return (
    term === '' ||
    getCourseStaff(course).some((name) => matchesNormalizedTerm(name, term))
  );
};

const matchesCourseFacts = (
  course: CourseRaw,
  criteria: CourseFilterCriteria,
): boolean =>
  !(criteria.hideInactive === true && isInactiveCourse(course)) &&
  !(
    criteria.offeredOnly === true &&
    getCurrentEnrollment(
      course,
      criteria.enrollmentYears ?? {},
      criteria.getSeason,
    ) === 0
  ) &&
  (criteria.channelOnly !== true || hasChannel(course)) &&
  (criteria.savedValues === undefined ||
    criteria.savedValues.has(getCourseLinkValue(course))) &&
  matchesStaff(course, criteria.staff ?? '');

// The values that identify a course: its names, abbreviation and codes.
export const getCourseIdentityFields = (course: CourseRaw): string[] =>
  [
    course.name,
    course['name-en'],
    course['2023-name'],
    course['2018-name'],
    course.abbreviation,
    course['2023-code'],
    course['2018-code'],
  ].filter((value): value is string => Boolean(value));

// Every value a course can be found by: its identity and teaching staff.
export const getCourseSearchFields = (course: CourseRaw): string[] => [
  ...getCourseIdentityFields(course),
  ...[course.professors, course.assistants].filter((value): value is string =>
    Boolean(value),
  ),
];

// `normalizedTerm` must come from normalizeSearchText.
export const courseMatchesSearch = (
  course: CourseRaw,
  normalizedTerm: string,
): boolean =>
  getCourseSearchFields(course).some((value) =>
    matchesNormalizedTerm(value, normalizedTerm),
  );

export const filterCourses = (
  courses: CourseRaw[],
  criteria: CourseFilterCriteria,
): CourseRaw[] => {
  const term = normalizeSearchText(criteria.searchTerm);
  return courses.filter(
    (course) =>
      (!term || courseMatchesSearch(course, term)) &&
      (criteria.matchesCurriculum?.(course) ??
        matchesCurriculumFilters(course, criteria)) &&
      matchesTags(course, criteria) &&
      matchesCourseFacts(course, criteria),
  );
};

const SORT_COLLATOR = new Intl.Collator();

const getPrimaryCreditsOf =
  (accreditation: Accreditation | null) =>
  (course: CourseRaw): number | undefined =>
    getPrimaryCredits(course, accreditation);

type SortConfig = {
  readonly accreditation: Accreditation | null;
  readonly column: SortColumn;
  readonly direction: SortDirection;
  readonly enrollmentYears?: EnrollmentYears;
  /** Overrides the accreditation's credits (master's courses). */
  readonly getCredits?: (course: CourseRaw) => number | undefined;
  readonly getSeason?: SeasonResolver;
  readonly language: Language;
};

// Courses without a value sort last in either direction.
const compareOptionalNumbers = (
  a: number | undefined,
  b: number | undefined,
  dir: number,
): number =>
  a === undefined || b === undefined
    ? Number(a === undefined) - Number(b === undefined)
    : (a - b) * dir;

const compareCourses = (
  a: CourseRaw,
  b: CourseRaw,
  config: SortConfig,
): number => {
  const dir = config.direction === 'asc' ? 1 : -1;
  switch (config.column) {
    case 'accreditation':
      return SORT_COLLATOR.compare(getAccLabel(a), getAccLabel(b)) * dir;
    case 'channel':
      return (Number(hasChannel(a)) - Number(hasChannel(b))) * dir;
    case 'credits':
      return compareOptionalNumbers(
        (config.getCredits ?? getPrimaryCreditsOf(config.accreditation))(a),
        (config.getCredits ?? getPrimaryCreditsOf(config.accreditation))(b),
        dir,
      );
    case 'name':
      return (
        SORT_COLLATOR.compare(
          getCourseName(a, config.accreditation, config.language),
          getCourseName(b, config.accreditation, config.language),
        ) * dir
      );
    case 'popularity':
      return (
        (getCurrentEnrollment(
          a,
          config.enrollmentYears ?? {},
          config.getSeason,
        ) -
          getCurrentEnrollment(
            b,
            config.enrollmentYears ?? {},
            config.getSeason,
          )) *
        dir
      );
    case 'semester':
      return compareOptionalNumbers(
        getCourseSemester(a, config.accreditation),
        getCourseSemester(b, config.accreditation),
        dir,
      );
    case 'tags':
      return (
        SORT_COLLATOR.compare(
          getCourseTags(a).join(','),
          getCourseTags(b).join(','),
        ) * dir
      );
    default:
      return 0;
  }
};

// Ties keep a stable, readable order by name.
export const sortCourses = (
  courses: CourseRaw[],
  config: SortConfig,
): CourseRaw[] =>
  courses.toSorted(
    (a, b) =>
      compareCourses(a, b, config) ||
      compareCourses(a, b, { ...config, column: 'name', direction: 'asc' }),
  );

export const sortIndicator = (
  active: SortColumn,
  direction: SortDirection,
  column: SortColumn,
): string => {
  if (active !== column) return '';
  return direction === 'asc' ? ' \u{2191}' : ' \u{2193}';
};
