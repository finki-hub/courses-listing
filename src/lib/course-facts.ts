import {
  ACADEMIC_YEARS,
  type AcademicYear,
  type Accreditation,
  type CourseRaw,
  getAccreditationInfo,
  getCourseCredits,
  getEnrollmentForYear,
  getStudyPrograms,
} from '@/types/course';

// Facts derived from the catalog that the listing filters and sorts by.

const INACTIVE_MARKER = '(неактивиран предмет)';
const ACCREDITATION_ORDER: readonly Accreditation[] = ['2023', '2018'];
const STAFF_COLLATOR = new Intl.Collator('mk');

// How a course's season is known: by default from its accreditation
// semester; master's courses take it from their programs.
export type SeasonResolver = (course: CourseRaw) => Season | undefined;

type Season = 'summer' | 'winter';

// The accreditation a course is shown by: the selected one, else the newest
// that has the course.
export const getPrimaryAccreditation = (
  course: CourseRaw,
  preferred: Accreditation | null,
): Accreditation | undefined =>
  (preferred === null
    ? ACCREDITATION_ORDER
    : [preferred, ...ACCREDITATION_ORDER]
  ).find((accreditation) => getAccreditationInfo(course, accreditation));

export const getCourseSemester = (
  course: CourseRaw,
  preferred: Accreditation | null,
): number | undefined => {
  const accreditation = getPrimaryAccreditation(course, preferred);
  if (accreditation === undefined) return undefined;
  const semester = Number.parseInt(
    getAccreditationInfo(course, accreditation)?.semester ?? '',
    10,
  );
  return Number.isNaN(semester) ? undefined : semester;
};

export const getPrimaryCredits = (
  course: CourseRaw,
  preferred: Accreditation | null,
): number | undefined => {
  const accreditation = getPrimaryAccreditation(course, preferred);
  return accreditation === undefined
    ? undefined
    : getCourseCredits(course, accreditation);
};

// The newest academic year with any enrollment, overall and per season. A
// year in progress has winter figures before summer ones, so summer courses
// are measured against the newest year that has summer figures.
export type EnrollmentYears = {
  readonly all?: AcademicYear;
  readonly summer?: AcademicYear;
  readonly winter?: AcademicYear;
};

const getCourseSeason = (course: CourseRaw): Season | undefined => {
  const semester = getCourseSemester(course, null);
  if (semester === undefined) return undefined;
  return semester % 2 === 1 ? 'winter' : 'summer';
};

const findLatestYear = (
  courses: readonly CourseRaw[],
): AcademicYear | undefined =>
  ACADEMIC_YEARS.find((year) =>
    courses.some((course) => getEnrollmentForYear(course, year) > 0),
  );

export const getLatestEnrollmentYears = (
  courses: readonly CourseRaw[],
  getSeason: SeasonResolver = getCourseSeason,
): EnrollmentYears => ({
  all: findLatestYear(courses),
  summer: findLatestYear(
    courses.filter((course) => getSeason(course) === 'summer'),
  ),
  winter: findLatestYear(
    courses.filter((course) => getSeason(course) === 'winter'),
  ),
});

// Enrollment in the newest year with figures for the course's season.
export const getCurrentEnrollment = (
  course: CourseRaw,
  years: EnrollmentYears,
  getSeason: SeasonResolver = getCourseSeason,
): number => {
  const season = getSeason(course);
  const year = (season === undefined ? undefined : years[season]) ?? years.all;
  return year === undefined ? 0 : getEnrollmentForYear(course, year);
};

// Inactive: marked as deactivated in place of its staff, or never enrolled.
export const isInactiveCourse = (course: CourseRaw): boolean =>
  course.professors.includes(INACTIVE_MARKER) ||
  ACADEMIC_YEARS.every((year) => getEnrollmentForYear(course, year) === 0);

export const getCourseStaff = (course: CourseRaw): string[] =>
  [course.professors, course.assistants]
    .flatMap((value = '') => value.split('\n'))
    .map((name) => name.trim())
    .filter((name) => name !== '' && name !== INACTIVE_MARKER);

export const getAllStaff = (courses: readonly CourseRaw[]): string[] =>
  [...new Set(courses.flatMap((course) => getCourseStaff(course)))].sort(
    (a, b) => STAFF_COLLATOR.compare(a, b),
  );

export const getDistinctCredits = (courses: readonly CourseRaw[]): number[] =>
  [
    ...new Set(
      courses.flatMap((course) =>
        ACCREDITATION_ORDER.filter((accreditation) =>
          getAccreditationInfo(course, accreditation),
        ).map((accreditation) => getCourseCredits(course, accreditation)),
      ),
    ),
  ].sort((a, b) => a - b);

// Study programs of the selected accreditation, or of both.
export const getListingPrograms = (
  accreditation: Accreditation | null,
): string[] => [
  ...new Set(
    (accreditation === null ? ACCREDITATION_ORDER : [accreditation]).flatMap(
      (value) => getStudyPrograms(value),
    ),
  ),
];
