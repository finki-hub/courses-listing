import { type CourseStatus } from '@/lib/prerequisite';
import {
  compareBySemesterAndName,
  getExclusiveProjectBlocker,
  isRequired,
  matchesSeasonFilter,
  type SimulatorCourse,
} from '@/lib/simulator';
import {
  ACADEMIC_YEARS,
  type AcademicYear,
  type CourseLevelFilter,
  getEnrollmentForYear,
} from '@/types/course';

export type NextCourse = {
  course: SimulatorCourse;
  enrollment: number;
  required: boolean;
};

export type NextCoursesContext = {
  enabledMap: Record<string, boolean>;
  fullLevels: ReadonlySet<number>;
  level: CourseLevelFilter;
  season: Season;
  statuses: Record<string, CourseStatus>;
};

export type Season = 'summer' | 'winter';

// From March, students next enrol in a winter semester; from October, in a
// summer one.
const WINTER_NEXT_FROM_MONTH = 3;
const SUMMER_NEXT_FROM_MONTH = 10;

/**
 * The season students enrol in next: the summer semester from October to
 * February, while the winter one runs, and the winter semester from March to
 * September.
 *
 * @param month - 1 to 12, starting with January
 * @returns Which semester students choose courses for next
 */
export const getUpcomingSeason = (month: number): Season =>
  month >= WINTER_NEXT_FROM_MONTH && month < SUMMER_NEXT_FROM_MONTH
    ? 'winter'
    : 'summer';

/**
 * The most recent academic year in which any of the courses has enrollment
 * data, so popularity compares the courses within one year.
 *
 * @param courses - The courses to compare
 * @returns The year, or undefined when none has data
 */
export const getReferenceYear = (
  courses: SimulatorCourse[],
): AcademicYear | undefined =>
  ACADEMIC_YEARS.find((year) =>
    courses.some((course) => getEnrollmentForYear(course.raw, year) > 0),
  );

const isCandidate = (course: SimulatorCourse, context: NextCoursesContext) => {
  const status = context.statuses[course.name];
  const required = isRequired(course.programState);
  return (
    !status?.listened &&
    !status?.passed &&
    (context.enabledMap[course.name] ?? true) &&
    getExclusiveProjectBlocker(context.statuses, course.name) === undefined &&
    (required || !context.fullLevels.has(course.level)) &&
    matchesSeasonFilter(course.semester, context.season) &&
    (context.level === null || course.level === context.level)
  );
};

const compareNextCourses = (a: NextCourse, b: NextCourse) =>
  Number(b.required) - Number(a.required) ||
  a.course.semester - b.course.semester ||
  (a.required ? 0 : b.enrollment - a.enrollment) ||
  compareBySemesterAndName(a.course, b.course);

/**
 * The courses a student can enrol in next: not yet taken, prerequisites met,
 * level limit not reached, offered in the given season and, optionally, of
 * the given level. Required courses
 * come first by semester; electives follow by semester, then by how many
 * students enrolled in the reference year.
 *
 * @param courses - The simulator courses
 * @param context - Statuses, availability and the season
 * @returns The ranked courses and the year their enrollment comes from
 */
export const rankNextCourses = (
  courses: SimulatorCourse[],
  context: NextCoursesContext,
): { items: NextCourse[]; year: AcademicYear | undefined } => {
  const candidates = courses.filter((course) => isCandidate(course, context));
  const year = getReferenceYear(candidates);
  const items = candidates
    .map((course) => ({
      course,
      enrollment: year ? getEnrollmentForYear(course.raw, year) : 0,
      required: isRequired(course.programState),
    }))
    .toSorted(compareNextCourses);
  return { items, year };
};
