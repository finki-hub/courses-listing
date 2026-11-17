import { getCourseIdentityFields } from '@/lib/course-filters';
import { type CourseStatus } from '@/lib/prerequisite';
import {
  matchesNormalizedTerm,
  normalizeSearchText,
} from '@/lib/search-normalization';
import {
  isExclusiveProjectCourse,
  isRequired,
  matchesSeasonFilter,
  type SimulatorCourse,
} from '@/lib/simulator';
import {
  type CourseLevelFilter,
  getCourseTags,
  type SeasonFilter,
} from '@/types/course';

export type CourseTypeFilter = 'all' | 'elective' | 'required';

export const COURSE_TYPE_FILTERS: readonly CourseTypeFilter[] = [
  'all',
  'required',
  'elective',
];

export type BulkStatus = 'listened' | 'passed';

export type SemesterGroup = {
  courses: SimulatorCourse[];
  semester: number;
};

export type SemesterSummary = {
  listenedCredits: number;
  passedCredits: number;
};

export type SimulatorViewCriteria = {
  enabledMap: Record<string, boolean>;
  level: CourseLevelFilter;
  search: string;
  season: SeasonFilter;
  showOnlyEnabled: boolean;
  tags: ReadonlySet<string>;
  type: CourseTypeFilter;
};

// Electives include the faculty list: both are chosen, not prescribed.
const matchesType = (course: SimulatorCourse, type: CourseTypeFilter) =>
  type === 'all' || isRequired(course.programState) === (type === 'required');

const matchesTags = (course: SimulatorCourse, tags: ReadonlySet<string>) =>
  tags.size === 0 || getCourseTags(course.raw).some((tag) => tags.has(tag));

const matchesSearch = (course: SimulatorCourse, term: string) =>
  term === '' ||
  [course.name, ...getCourseIdentityFields(course.raw)].some((value) =>
    matchesNormalizedTerm(value, term),
  );

// Courses that pass every simulator filter, in their original order.
export const filterSimulatorCourses = (
  courses: SimulatorCourse[],
  criteria: SimulatorViewCriteria,
): SimulatorCourse[] => {
  const term = normalizeSearchText(criteria.search);
  return courses.filter(
    (course) =>
      (!criteria.showOnlyEnabled ||
        (criteria.enabledMap[course.name] ?? true)) &&
      (criteria.level === null || course.level === criteria.level) &&
      matchesSeasonFilter(course.semester, criteria.season) &&
      matchesType(course, criteria.type) &&
      matchesTags(course, criteria.tags) &&
      matchesSearch(course, term),
  );
};

// Consecutive runs by semester; the input is already sorted by semester.
export const groupBySemester = (
  courses: SimulatorCourse[],
): SemesterGroup[] => {
  const groups: SemesterGroup[] = [];
  for (const course of courses) {
    const last = groups.at(-1);
    if (last?.semester === course.semester) last.courses.push(course);
    else groups.push({ courses: [course], semester: course.semester });
  }
  return groups;
};

export const summarizeSemester = (
  courses: SimulatorCourse[],
  statuses: Record<string, CourseStatus>,
): SemesterSummary => {
  let listenedCredits = 0;
  let passedCredits = 0;
  for (const course of courses) {
    const status = statuses[course.name];
    if (status?.listened) listenedCredits += course.credits;
    if (status?.passed) passedCredits += course.credits;
  }
  return { listenedCredits, passedCredits };
};

/**
 * The courses a semester's bulk action changes: its required courses that are
 * available, not yet at the target status and not one of the mutually
 * exclusive projects. Electives are left alone because students pick only a
 * few of them, and marking them all would also break the level limits.
 *
 * @param courses - The semester's courses
 * @param context - Current availability and statuses
 * @param context.enabledMap - Whether each course's prerequisites are met
 * @param context.statuses - The current statuses
 * @param target - The status to reach
 * @returns The names of the courses to change
 */
export const getBulkTargets = (
  courses: SimulatorCourse[],
  context: {
    enabledMap: Record<string, boolean>;
    statuses: Record<string, CourseStatus>;
  },
  target: BulkStatus,
): string[] =>
  courses
    .filter((course) => {
      const status = context.statuses[course.name];
      return (
        isRequired(course.programState) &&
        (context.enabledMap[course.name] ?? true) &&
        !isExclusiveProjectCourse(course.name) &&
        !(target === 'passed' ? status?.passed : status?.listened)
      );
    })
    .map((course) => course.name);

export const markCourses = (
  statuses: Record<string, CourseStatus>,
  names: string[],
  target: BulkStatus,
): Record<string, CourseStatus> => {
  const next = { ...statuses };
  for (const name of names) {
    next[name] = {
      listened: true,
      passed: target === 'passed' || (statuses[name]?.passed ?? false),
    };
  }
  return next;
};
