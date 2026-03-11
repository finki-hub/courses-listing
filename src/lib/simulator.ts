import {
  type CourseInfo,
  type CourseStatus,
  describePrereqNode,
  type EvalContext,
  isPrerequisiteMet,
  OVERRIDE_CREDITS,
  type PrereqNode,
} from '@/lib/prerequisite';
import {
  type Accreditation,
  type AccreditationInfo,
  type CourseRaw,
  getCourseCredits,
  getCourseStateForProgram,
} from '@/types/course';

export type GraduationEligibility = {
  canGrad3yr: boolean;
  canGrad4yr: boolean;
  credits3yr: boolean;
  credits4yr: boolean;
  graduated3yr: boolean;
  graduated4yr: boolean;
};

export type SeasonFilter = 'summer' | 'winter' | null;

export type SimulatorCourse = {
  credits: number;
  level: number;
  name: string;
  prereqNode: PrereqNode;
  prerequisite: string | undefined;
  programState: string | undefined;
  raw: CourseRaw;
  rawPrereqNode: PrereqNode;
  semester: number;
};

const STORAGE_KEY_PREFIX = 'enrollment-';
export const STORAGE_KEY_ACC = `${STORAGE_KEY_PREFIX}accreditation`;
export const STORAGE_KEY_HPC = `${STORAGE_KEY_PREFIX}hpc`;
export const STORAGE_KEY_PROGRAM = `${STORAGE_KEY_PREFIX}program`;
export const STORAGE_KEY_UNI_LIST_CREDITS = `${STORAGE_KEY_PREFIX}uni-list-credits`;
export const HPC_CREDITS = 6;
export const UNI_LIST_CREDITS_MAX = 36;
export const DIPLOMA_THESIS_COURSE_NAME = 'Дипломска работа';
export const TEAM_PROJECT_COURSE_NAME = 'Тимски проект';
export const INDIVIDUAL_PROJECT_COURSE_NAME = 'Самостоен проект';
export const GRADUATION_CREDITS_3YR = 174;
export const GRADUATION_CREDITS_4YR = 234;
export const LEVEL_CREDIT_LIMITS: Record<number, number> = { 1: 6, 2: 36 };
const REQUIRED_MARKER =
  '\u0437\u0430\u0434\u043E\u043B\u0436\u0438\u0442\u0435\u043B\u0435\u043D';
const FACULTY_LIST_MARKER = '\u043D\u0435\u043C\u0430';
const FOUR_YEAR_MARKER = '(4 г.)';
const EXCLUSIVE_PROJECTS_RULE_TEXT =
  'Тимски проект и Самостоен проект се меѓусебно исклучиви, може да се запише и положи само еден.';

export const isRequired = (programState: string | undefined): boolean =>
  programState?.includes(REQUIRED_MARKER) ?? false;

export const compareBySemesterAndName = (
  a: { name: string; semester: number },
  b: { name: string; semester: number },
): number => a.semester - b.semester || a.name.localeCompare(b.name, 'mk');

export const matchesSeasonFilter = (
  semester: number,
  filter: SeasonFilter,
): boolean =>
  filter === null ||
  (filter === 'winter' ? semester % 2 === 1 : semester % 2 === 0);

/** Semesters 7+ belong to year 4, e.g. "задолжителен (сем. 7)" */
const FOUR_YEAR_SEMESTER_RE = /\(сем\.\s*[78]\)/u;

export const isFourYearOnly = (programState: string): boolean =>
  programState.includes(FOUR_YEAR_MARKER) ||
  FOUR_YEAR_SEMESTER_RE.test(programState);

export type ProgramStateKind =
  | 'elective'
  | 'faculty-list'
  | 'required'
  | 'required-4yr';

export const getProgramStateKind = (
  programState: string | undefined,
): ProgramStateKind | undefined => {
  if (!programState) return undefined;
  if (programState === FACULTY_LIST_MARKER) return 'faculty-list';
  if (isRequired(programState))
    return isFourYearOnly(programState) ? 'required-4yr' : 'required';
  return 'elective';
};

export const PROGRAM_STATE_LABELS: Record<ProgramStateKind, string> = {
  elective: 'Изборен',
  'faculty-list': 'Факултетска листа',
  required: 'Задолжителен',
  'required-4yr': 'Задолжителен (4г.)',
};

export const PROGRAM_STATE_SHORT_LABELS: Record<ProgramStateKind, string> = {
  elective: 'Изб.',
  'faculty-list': 'Факс. листа',
  required: 'Зад.',
  'required-4yr': 'Зад. (4г.)',
};

const isStatusRecord = (v: unknown): v is Record<string, CourseStatus> => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  for (const entry of Object.values(v as Record<string, unknown>)) {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof (entry as Record<string, unknown>)['listened'] !== 'boolean' ||
      typeof (entry as Record<string, unknown>)['passed'] !== 'boolean'
    )
      return false;
  }
  return true;
};

const EXCLUSIVE_PROJECT_PAIRS: Record<string, string> = {
  [INDIVIDUAL_PROJECT_COURSE_NAME]: TEAM_PROJECT_COURSE_NAME,
  [TEAM_PROJECT_COURSE_NAME]: INDIVIDUAL_PROJECT_COURSE_NAME,
};

export const getExclusiveProjectBlocker = (
  statuses: Record<string, CourseStatus>,
  name: string,
): string | undefined => {
  const pair = EXCLUSIVE_PROJECT_PAIRS[name];
  if (!pair) return undefined;
  const pairStatus = statuses[pair];
  return pairStatus?.listened || pairStatus?.passed ? pair : undefined;
};

export const normalizeExclusiveProjectStatuses = (
  statuses: Record<string, CourseStatus>,
): Record<string, CourseStatus> => {
  const team = statuses[TEAM_PROJECT_COURSE_NAME];
  const individual = statuses[INDIVIDUAL_PROJECT_COURSE_NAME];

  if (
    !(team?.listened || team?.passed) ||
    !(individual?.listened || individual?.passed)
  ) {
    return statuses;
  }

  const keepTeam = team.passed || !individual.passed;
  return {
    ...statuses,
    [keepTeam ? INDIVIDUAL_PROJECT_COURSE_NAME : TEAM_PROJECT_COURSE_NAME]: {
      listened: false,
      passed: false,
    },
  };
};

export const clampUniListCredits = (value: number): number => {
  if (Number.isNaN(value) || value < 0) return 0;
  return Math.min(UNI_LIST_CREDITS_MAX, Math.trunc(value));
};

export const loadUniListCredits = (): number =>
  clampUniListCredits(
    Number(localStorage.getItem(STORAGE_KEY_UNI_LIST_CREDITS) ?? '0'),
  );

export const saveUniListCredits = (credits: number): void => {
  localStorage.setItem(
    STORAGE_KEY_UNI_LIST_CREDITS,
    String(clampUniListCredits(credits)),
  );
};

const getExclusiveProjectReasonLines = (blocker: string): string[] => [
  `\u274C Не може да се запише (${blocker} е веќе слушан или положен)`,
  `\u26D4 ${blocker} е веќе слушан или положен - ${EXCLUSIVE_PROJECTS_RULE_TEXT}`,
];

export const loadStatuses = (
  accreditation: Accreditation,
): Record<string, CourseStatus> => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${accreditation}`);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isStatusRecord(parsed)
      ? normalizeExclusiveProjectStatuses(parsed)
      : {};
  } catch {
    return {};
  }
};

export const saveStatuses = (
  accreditation: Accreditation,
  statuses: Record<string, CourseStatus>,
): void => {
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${accreditation}`,
    JSON.stringify(statuses),
  );
};

export const toggleListenedStatus = (
  statuses: Record<string, CourseStatus>,
  name: string,
): Record<string, CourseStatus> => {
  const cur = statuses[name] ?? { listened: false, passed: false };
  const listened = !cur.listened;
  const next = {
    ...statuses,
    [name]: { listened, passed: listened ? cur.passed : false },
  };
  const pair = EXCLUSIVE_PROJECT_PAIRS[name];
  if (listened && pair) {
    next[pair] = { listened: false, passed: false };
  }
  return normalizeExclusiveProjectStatuses(next);
};

export const togglePassedStatus = (
  statuses: Record<string, CourseStatus>,
  name: string,
): Record<string, CourseStatus> => {
  const cur = statuses[name] ?? { listened: false, passed: false };
  const passed = !cur.passed;
  const next = {
    ...statuses,
    [name]: { listened: passed || cur.listened, passed },
  };
  const pair = EXCLUSIVE_PROJECT_PAIRS[name];
  if (passed && pair) {
    next[pair] = { listened: false, passed: false };
  }
  return normalizeExclusiveProjectStatuses(next);
};

export const buildSimulatorCourse = (config: {
  acc: Accreditation;
  info: AccreditationInfo;
  prog: string;
  raw: CourseRaw;
}): SimulatorCourse | undefined => {
  const { acc, info, prog, raw } = config;
  const name = info.name ?? raw.name;
  if (!info.semester) return undefined;
  const semester = Number.parseInt(info.semester);
  const level = info.level ? Number.parseInt(info.level) : 0;
  const programState = getCourseStateForProgram(raw, acc, prog);

  return {
    credits: getCourseCredits(raw, acc),
    level,
    name,
    prereqNode: { type: 'none' },
    prerequisite: info.prerequisite,
    programState,
    raw,
    rawPrereqNode: { type: 'none' },
    semester,
  };
};

export const pruneElectivePrereqs = (
  node: PrereqNode,
  electives: Set<string>,
): PrereqNode => {
  switch (node.type) {
    case 'and':
    case 'or': {
      const children = node.children
        .map((c) => pruneElectivePrereqs(c, electives))
        .filter((c) => c.type !== 'none');
      if (children.length === 0) return { type: 'none' };
      if (children.length === 1) return children[0] ?? { type: 'none' };
      return { children, type: node.type };
    }
    case 'course':
      return electives.has(node.name) ? { type: 'none' } : node;
    default:
      return node;
  }
};

/** Safety cap for the fixed-point iteration in computeEnabledMap */
const MAX_FIXED_POINT_ITERATIONS = 20;

export const computeEnabledMap = (config: {
  courseInfoMap: Map<string, CourseInfo>;
  courses: SimulatorCourse[];
  statuses: Record<string, CourseStatus>;
  totalCredits: number;
}): Record<string, boolean> => {
  const { courseInfoMap: infoMap, courses, statuses: s, totalCredits } = config;
  const enabled: Record<string, boolean> = {};

  for (const c of courses) enabled[c.name] = true;

  for (let iter = 0; iter < MAX_FIXED_POINT_ITERATIONS; iter++) {
    let changed = false;
    for (const c of courses) {
      const isBlockedByProjectPair = getExclusiveProjectBlocker(s, c.name);
      if (c.programState === FACULTY_LIST_MARKER) {
        const nextFacultyListEnabled = !isBlockedByProjectPair;
        if (enabled[c.name] !== nextFacultyListEnabled) {
          enabled[c.name] = nextFacultyListEnabled;
          changed = true;
        }
        continue;
      }
      const met = isPrerequisiteMet(c.prereqNode, {
        courseInfoMap: infoMap,
        courseSemester: c.semester,
        statuses: s,
        totalCredits,
      });
      const nextEnabled = met && !isBlockedByProjectPair;
      if (nextEnabled !== enabled[c.name]) {
        enabled[c.name] = nextEnabled;
        changed = true;
      }
    }
    if (!changed) break;
  }

  return enabled;
};

export const computeReasonMap = (config: {
  courseInfoMap: Map<string, CourseInfo>;
  courses: SimulatorCourse[];
  electiveCourses: Set<string>;
  enabledMap: Record<string, boolean>;
  fullLevels: Set<number>;
  overLimitSet: Set<string>;
  statuses: Record<string, CourseStatus>;
  totalCredits: number;
}): Record<string, string> => {
  const reasons: Record<string, string> = {};

  for (const c of config.courses) {
    const parts: string[] = [];
    const st = config.statuses[c.name];
    const required = isRequired(c.programState);
    const enabled = config.enabledMap[c.name] ?? true;
    const exclusiveProjectBlocker = getExclusiveProjectBlocker(
      config.statuses,
      c.name,
    );

    // ── Status ──
    if (st?.passed) parts.push('\u2705 Статус: Положен');
    else if (st?.listened) parts.push('\uD83D\uDCD6 Статус: Слушан');
    else parts.push('\u2B1C Статус: Не е слушан');

    // ── Enrollment eligibility ──
    if (exclusiveProjectBlocker) {
      parts.push(...getExclusiveProjectReasonLines(exclusiveProjectBlocker));
    } else if (enabled) {
      parts.push('\u2705 Може да се запише');
    } else {
      parts.push('\u274C Не може да се запише (предусловите не се исполнети)');
    }

    // ── Credit level limits ──
    if (config.overLimitSet.has(c.name)) {
      const limit = LEVEL_CREDIT_LIMITS[c.level] ?? 0;
      parts.push(
        `\u274C Надминат L${String(c.level)} лимит (макс. ${String(limit)} кредити)`,
      );
    } else if (!st?.passed && !required && config.fullLevels.has(c.level)) {
      const limit = LEVEL_CREDIT_LIMITS[c.level] ?? 0;
      parts.push(
        `\u26A0\uFE0F L${String(c.level)} лимит пополнет (${String(limit)} кредити)`,
      );
    }

    // ── Program info ──
    if (required) {
      parts.push(`\u2139\uFE0F Задолжителен предмет`);
    } else if (c.programState && c.programState !== FACULTY_LIST_MARKER) {
      parts.push('\u2139\uFE0F Изборен предмет');
    }

    // ── Prerequisites ──
    if (c.programState === FACULTY_LIST_MARKER) {
      parts.push('\u2139\uFE0F Факултетска листа \u2013 нема предуслов');
    } else if (
      c.prereqNode.type === 'none' &&
      c.rawPrereqNode.type === 'none'
    ) {
      parts.push('\u2705 Нема предуслов');
    } else {
      const ctx: EvalContext = {
        courseInfoMap: config.courseInfoMap,
        courseSemester: c.semester,
        statuses: config.statuses,
        totalCredits: config.totalCredits,
      };
      if (config.totalCredits >= OVERRIDE_CREDITS) {
        parts.push('\u2705 \u2265180 кредити \u2013 предуслови не важат');
      } else {
        parts.push(
          '\uD83D\uDCCB Предуслов:',
          ...describePrereqNode(c.rawPrereqNode, ctx, config.electiveCourses),
        );
      }
    }

    reasons[c.name] = parts.join('\n');
  }

  return reasons;
};

export const computeOverLimitInfo = (
  courses: SimulatorCourse[],
  s: Record<string, CourseStatus>,
): {
  excessCredits: number;
  fullLevels: Set<number>;
  levels: number[];
  names: Set<string>;
} => {
  const creditsPerLevel: Record<number, number> = {};
  const coursesByLevel: Record<number, SimulatorCourse[]> = {};

  for (const c of courses) {
    if (!s[c.name]?.passed) continue;
    if (isRequired(c.programState)) continue;
    creditsPerLevel[c.level] = (creditsPerLevel[c.level] ?? 0) + c.credits;
    (coursesByLevel[c.level] ??= []).push(c);
  }

  const names = new Set<string>();
  const levels: number[] = [];
  const fullLevels = new Set<number>();
  let excessCredits = 0;

  for (const [level, limit] of Object.entries(LEVEL_CREDIT_LIMITS)) {
    const lvl = Number(level);
    const actual = creditsPerLevel[lvl] ?? 0;

    if (actual >= limit) fullLevels.add(lvl);
    if (actual <= limit) continue;

    levels.push(lvl);
    excessCredits += actual - limit;

    const list = (coursesByLevel[lvl] ?? []).slice();
    list.sort(compareBySemesterAndName);

    let acc = 0;
    for (const c of list) {
      if (acc + c.credits <= limit) {
        acc += c.credits;
      } else {
        names.add(c.name);
      }
    }
  }

  return { excessCredits, fullLevels, levels, names };
};
