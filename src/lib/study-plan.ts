import { fromStorageKeys, toStorageKeys } from '@/lib/course-storage-keys';
import {
  type CourseInfo,
  type CourseStatus,
  isPrerequisiteMet,
} from '@/lib/prerequisite';
import { readBrowserStorage, writeBrowserStorage } from '@/lib/safe-storage';
import {
  compareBySemesterAndName,
  getExclusiveProjectBlocker,
  getProgramStateKind,
  GRADUATION_CREDITS_3YR,
  GRADUATION_CREDITS_4YR,
  isFourYearOnly,
  isRequired,
  LEVEL_CREDIT_LIMITS,
  type SimulatorCourse,
} from '@/lib/simulator';
import { type Accreditation, type CourseRaw } from '@/types/course';

export type PlanContext = {
  /** Credits already earned: passed courses, HPC and the university list. */
  baseCredits: number;
  courseInfoMap: Map<string, CourseInfo>;
  courses: SimulatorCourse[];
  /** Expert mode: prerequisites are not checked. */
  ignorePrerequisites?: boolean;
  plan: StudyPlan;
  statuses: Record<string, CourseStatus>;
};

export type PlanEvaluation = {
  /** The first semester that completes each degree, if the plan reaches it. */
  graduation: { fourYear?: number; threeYear?: number };
  issues: Record<string, PlanIssue[]>;
  semesters: PlannedSemester[];
  /** Required courses that are neither taken nor planned. */
  unplannedRequired: SimulatorCourse[];
};

export type PlanIssue =
  'exclusive' | 'levelLimit' | 'past' | 'prerequisites' | 'season';

export type PlannedSemester = {
  courses: SimulatorCourse[];
  credits: number;
  /** Credits after this semester, counting only electives within the limits. */
  cumulativeCredits: number;
  semester: number;
};

/** Course name to the semester (1 to 8) it is planned for. */
export type StudyPlan = Record<string, number>;

export const LAST_SEMESTER = 8;
/** The usual load of a semester, shown for orientation; no rule caps it. */
export const STANDARD_SEMESTER_CREDITS = 30;

const STORAGE_KEY_PREFIX = 'enrollment-plan-';
const PLANNED: CourseStatus = { listened: true, passed: true };

const isTaken = (status: CourseStatus | undefined) =>
  (status?.listened ?? false) || (status?.passed ?? false);

const isSemester = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 1 &&
  value <= LAST_SEMESTER;

/**
 * The first semester the student still plans: the one after the latest
 * semester of any course they have taken.
 *
 * @param courses - The simulator courses
 * @param statuses - What the student has enrolled in or passed
 * @returns A semester from 1 to 9; 9 means there is nothing left to plan
 */
export const getPlanStart = (
  courses: SimulatorCourse[],
  statuses: Record<string, CourseStatus>,
): number =>
  Math.max(
    0,
    ...courses
      .filter((course) => isTaken(statuses[course.name]))
      .map((course) => course.semester),
  ) + 1;

/**
 * The semesters a course can be planned for: from the plan's start, in the
 * same season as the course is offered (odd semesters are winter).
 *
 * @param course - The course to place
 * @param start - The first semester of the plan
 * @returns The semesters, earliest first
 */
export const getPlanOptions = (
  course: SimulatorCourse,
  start: number,
): number[] => {
  const options: number[] = [];
  for (let semester = start; semester <= LAST_SEMESTER; semester++) {
    if (semester % 2 === course.semester % 2) options.push(semester);
  }
  return options;
};

const isElective = (course: SimulatorCourse) =>
  !isRequired(course.programState);

// Electives over a level's limit, in the order they are taken or planned.
const findOverLimitPlanned = (
  courses: SimulatorCourse[],
  statuses: Record<string, CourseStatus>,
  plan: StudyPlan,
): Set<string> => {
  const order = (course: SimulatorCourse) =>
    isTaken(statuses[course.name]) ? 0 : (plan[course.name] ?? 0);
  const counted = courses
    .filter(
      (course) =>
        isElective(course) &&
        (isTaken(statuses[course.name]) || plan[course.name] !== undefined),
    )
    .toSorted((a, b) => order(a) - order(b));
  const used: Record<number, number> = {};
  const over = new Set<string>();
  for (const course of counted) {
    const limit = LEVEL_CREDIT_LIMITS[course.level];
    const total = (used[course.level] ?? 0) + course.credits;
    if (limit !== undefined && total > limit) {
      if (!isTaken(statuses[course.name])) over.add(course.name);
      continue;
    }
    used[course.level] = total;
  }
  return over;
};

type Projection = {
  /** Earned credits plus the courses in progress. */
  credits: number;
  planned: SimulatorCourse[];
  /** Statuses with the courses in progress counted as passed. */
  statuses: Record<string, CourseStatus>;
};

// Where the student stands once the courses in progress are passed.
const project = (
  context: PlanContext,
  planned: SimulatorCourse[],
): Projection => {
  const statuses = { ...context.statuses };
  let credits = context.baseCredits;
  for (const course of context.courses) {
    const status = statuses[course.name];
    if (!status?.listened || status.passed) continue;
    statuses[course.name] = PLANNED;
    credits += course.credits;
  }
  return { credits, planned, statuses };
};

// The statuses and credits the plan reaches before the given semester.
const getStateBefore = (
  semester: number,
  context: PlanContext,
  projection: Projection,
) => {
  const statuses = { ...projection.statuses };
  let credits = projection.credits;
  for (const course of projection.planned) {
    const plannedFor = context.plan[course.name] ?? 0;
    if (plannedFor >= semester) continue;
    statuses[course.name] = PLANNED;
    credits += course.credits;
  }
  return { credits, statuses };
};

const findIssues = (
  course: SimulatorCourse,
  context: PlanContext,
  extra: { overLimit: Set<string>; projection: Projection; start: number },
): PlanIssue[] => {
  const semester = context.plan[course.name] ?? 0;
  const issues: PlanIssue[] = [];
  if (semester < extra.start) issues.push('past');
  // Odd semesters are winter; a stale or shared plan can bypass the select.
  if (semester % 2 !== course.semester % 2) issues.push('season');
  const before = getStateBefore(semester, context, extra.projection);
  const facultyList =
    getProgramStateKind(course.programState) === 'faculty-list';
  const prerequisitesMet =
    facultyList ||
    context.ignorePrerequisites === true ||
    isPrerequisiteMet(course.prereqNode, {
      courseInfoMap: context.courseInfoMap,
      courseSemester: course.semester,
      statuses: before.statuses,
      totalCredits: before.credits,
    });
  if (!prerequisitesMet) issues.push('prerequisites');
  if (getExclusiveProjectBlocker(before.statuses, course.name)) {
    issues.push('exclusive');
  }
  if (extra.overLimit.has(course.name)) issues.push('levelLimit');
  return issues;
};

// The earliest semester by which every required course of a degree is taken
// or planned and the credits reach the target.
const findGraduation = (
  semesters: PlannedSemester[],
  context: PlanContext,
  degree: { credits: number; fourYear: boolean },
): number | undefined => {
  const required = context.courses.filter(
    (course) =>
      isRequired(course.programState) &&
      (degree.fourYear || !isFourYearOnly(course.programState ?? '')),
  );
  const doneBy = (course: SimulatorCourse) =>
    isTaken(context.statuses[course.name])
      ? 0
      : (context.plan[course.name] ?? Infinity);
  const requiredDoneBy = Math.max(0, ...required.map(doneBy));
  return semesters.find(
    (entry) =>
      entry.semester >= requiredDoneBy &&
      entry.cumulativeCredits >= degree.credits,
  )?.semester;
};

/**
 * Checks a study plan: what each planned course still lacks, the credits per
 * semester and when each degree would be completed. Courses planned earlier
 * count as passed by the later semesters, since a plan assumes passing them.
 *
 * @param context - The courses, statuses, earned credits and the plan
 * @returns The plan's semesters, issues and projected graduation
 */
export const evaluatePlan = (context: PlanContext): PlanEvaluation => {
  const start = getPlanStart(context.courses, context.statuses);
  const planned = context.courses.filter(
    (course) =>
      !isTaken(context.statuses[course.name]) &&
      isSemester(context.plan[course.name]),
  );
  const overLimit = findOverLimitPlanned(
    context.courses,
    context.statuses,
    context.plan,
  );

  const projection = project(context, planned);
  const issues: Record<string, PlanIssue[]> = {};
  for (const course of planned) {
    const found = findIssues(course, context, {
      overLimit,
      projection,
      start,
    });
    if (found.length > 0) issues[course.name] = found;
  }

  const countedCredits = (courses: SimulatorCourse[]) =>
    courses
      .filter((course) => !overLimit.has(course.name))
      .reduce((sum, course) => sum + course.credits, 0);
  // Courses planned for semesters already behind count, as they do for the
  // prerequisites of later ones.
  let cumulative =
    projection.credits +
    countedCredits(
      planned.filter((course) => (context.plan[course.name] ?? 0) < start),
    );
  const semesters: PlannedSemester[] = [];
  // From a start after the last semester, nothing is left to plan.
  for (let semester = start; semester <= LAST_SEMESTER; semester++) {
    const courses = planned.filter(
      (course) => context.plan[course.name] === semester,
    );
    const credits = courses.reduce((sum, course) => sum + course.credits, 0);
    cumulative += countedCredits(courses);
    semesters.push({
      courses,
      credits,
      cumulativeCredits: cumulative,
      semester,
    });
  }

  const unplannedRequired = context.courses.filter(
    (course) =>
      isRequired(course.programState) &&
      !isTaken(context.statuses[course.name]) &&
      !isSemester(context.plan[course.name]),
  );

  return {
    graduation: {
      fourYear: findGraduation(semesters, context, {
        credits: GRADUATION_CREDITS_4YR,
        fourYear: true,
      }),
      threeYear: findGraduation(semesters, context, {
        credits: GRADUATION_CREDITS_3YR,
        fourYear: false,
      }),
    },
    issues,
    semesters,
    unplannedRequired,
  };
};

/**
 * Sets or clears a course's semester; an unknown semester removes it.
 *
 * @param plan - The current plan
 * @param name - The course
 * @param semester - The new semester, or undefined to remove the course
 * @returns The new plan
 */
export const setPlannedSemester = (
  plan: StudyPlan,
  name: string,
  semester: number | undefined,
): StudyPlan => {
  const next = Object.fromEntries(
    Object.entries(plan).filter(([key]) => key !== name),
  );
  if (isSemester(semester)) next[name] = semester;
  return next;
};

// Like statuses, a plan is saved by course code and read back by name.
export const loadPlan = (
  accreditation: Accreditation,
  courses: readonly CourseRaw[] = [],
): StudyPlan => {
  try {
    const parsed: unknown = JSON.parse(
      readBrowserStorage(`${STORAGE_KEY_PREFIX}${accreditation}`) ?? '{}',
    );
    return typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
      ? {}
      : fromStorageKeys(
          Object.fromEntries(
            Object.entries(parsed).filter((entry): entry is [string, number] =>
              isSemester(entry[1]),
            ),
          ),
          courses,
          accreditation,
        );
  } catch {
    return {};
  }
};

export const savePlan = (
  accreditation: Accreditation,
  plan: StudyPlan,
  courses: readonly CourseRaw[] = [],
) =>
  writeBrowserStorage(
    `${STORAGE_KEY_PREFIX}${accreditation}`,
    JSON.stringify(toStorageKeys(plan, courses, accreditation)),
  );

// A required course's semesters to try: from its recommended one on, or from
// the plan's start when the student is past it.
const getFillOptions = (course: SimulatorCourse, start: number): number[] => {
  const options = getPlanOptions(course, start);
  const fromRecommended = options.filter(
    (semester) => semester >= course.semester,
  );
  return fromRecommended.length > 0 ? fromRecommended : options;
};

/**
 * Plans every required course not yet taken or planned: each in its
 * recommended semester, moved to a later one of its season while what it
 * requires is not taken or planned before it. Electives are left alone, and
 * so is what the student already planned.
 *
 * @param context - The courses, statuses, earned credits and the plan
 * @returns The plan with the required courses added
 */
export const fillRequiredCourses = (context: PlanContext): StudyPlan => {
  const start = getPlanStart(context.courses, context.statuses);
  const choices = new Map<string, number[]>();
  let plan = context.plan;
  const toPlace = context.courses
    .filter(
      (course) =>
        isRequired(course.programState) &&
        !isTaken(context.statuses[course.name]) &&
        !isSemester(context.plan[course.name]),
    )
    .toSorted(compareBySemesterAndName);
  for (const course of toPlace) {
    const options = getFillOptions(course, start);
    const first = options[0];
    if (first === undefined) continue;
    choices.set(course.name, options);
    plan = setPlannedSemester(plan, course.name, first);
  }

  // Each round moves the courses still missing a prerequisite a year later.
  for (let round = 0; round < LAST_SEMESTER; round++) {
    const { issues } = evaluatePlan({ ...context, plan });
    let moved = false;
    for (const [name, options] of choices) {
      if (!issues[name]?.includes('prerequisites')) continue;
      const plannedFor = plan[name] ?? 0;
      const later = options.find((semester) => semester > plannedFor);
      if (later === undefined) continue;
      plan = setPlannedSemester(plan, name, later);
      moved = true;
    }
    if (!moved) break;
  }
  return plan;
};
