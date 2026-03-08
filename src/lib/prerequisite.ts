export type CourseInfo = {
  credits: number;
  name: string;
  semester: number;
};

export type CourseStatus = {
  listened: boolean;
  passed: boolean;
};

export type EvalContext = {
  courseInfoMap: Map<string, CourseInfo>;
  courseSemester: number;
  statuses: Record<string, CourseStatus>;
  totalCredits: number;
};

export type PrereqNode =
  | { amount: number; type: 'credits' }
  | { children: PrereqNode[]; type: 'and' }
  | { children: PrereqNode[]; type: 'or' }
  | { name: string; type: 'course' }
  | { text: string; type: 'unknown' }
  | { type: 'none' };

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const splitTopLevel = (text: string, separator: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let i = 0;

  while (i < text.length) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;

    if (depth === 0 && text.startsWith(separator, i)) {
      parts.push(current);
      current = '';
      i += separator.length;
    } else {
      current += text[i];
      i++;
    }
  }
  parts.push(current);
  return parts;
};

/**
 * Unified recursive-descent parser that avoids forward references.
 *
 * Grammar: expr   → term (" или " term)*
 *          term   → factor (" и " factor)*
 *          factor → "(" expr ")" | course_token
 */
const parseLevel = (
  text: string,
  courses: string[],
  level: 'expr' | 'factor' | 'term',
): PrereqNode => {
  const trimmed = text.trim();

  if (level === 'expr') {
    const parts = splitTopLevel(trimmed, ' или ');
    if (parts.length <= 1) {
      return parseLevel(parts[0] ?? trimmed, courses, 'term');
    }
    return {
      children: parts.map((p) => parseLevel(p, courses, 'term')),
      type: 'or',
    };
  }

  if (level === 'term') {
    const parts = splitTopLevel(trimmed, ' и ');
    if (parts.length <= 1) {
      return parseLevel(parts[0] ?? trimmed, courses, 'factor');
    }
    return {
      children: parts.map((p) => parseLevel(p, courses, 'factor')),
      type: 'and',
    };
  }

  // factor
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return parseLevel(trimmed.slice(1, -1), courses, 'expr');
  }

  const match = /^%%(?<idx>\d+)%%$/u.exec(trimmed);
  const idxStr = match?.groups?.['idx'];
  if (idxStr !== undefined) {
    const idx = Number.parseInt(idxStr);
    return { name: courses[idx] ?? trimmed, type: 'course' };
  }

  return { text: trimmed, type: 'unknown' };
};

/**
 * Tokenise known course names out of the text (longest-first, case-insensitive),
 * then recursive-descent-parse the remaining connectors / parentheses.
 */
export const parsePrerequisite = (
  text: string | undefined,
  knownCourseNames: string[],
): PrereqNode => {
  if (!text || text.trim() === '') return { type: 'none' };

  const creditMatch = /^(?<amt>\d+)\s*кредити$/u.exec(text.trim());
  const creditAmt = creditMatch?.groups?.['amt'];
  if (creditAmt !== undefined) {
    return { amount: Number.parseInt(creditAmt), type: 'credits' };
  }

  const sorted = [...knownCourseNames].sort((a, b) => b.length - a.length);
  const found: string[] = [];
  let tokenised = text;

  for (const name of sorted) {
    const lowerIdx = tokenised.toLowerCase().indexOf(name.toLowerCase());
    if (lowerIdx !== -1) {
      found.push(name);
      tokenised = `${tokenised.slice(
        0,
        lowerIdx,
      )}%%${String(found.length - 1)}%%${tokenised.slice(
        lowerIdx + name.length,
      )}`;
    }
  }

  if (found.length === 0) return { text, type: 'unknown' };
  return parseLevel(tokenised, found, 'expr');
};

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export const OVERRIDE_CREDITS = 180;

/**
 * Check whether a single course-name prerequisite is met.
 *
 * - If the prerequisite course is exactly 1 semester behind the current course,
 *   having **listened** (enrolled) is enough.
 * - Otherwise the prerequisite course must be **passed**.
 */
const isCoursePrereqMet = (prereqName: string, ctx: EvalContext): boolean => {
  const status = ctx.statuses[prereqName];
  if (!status) return false;

  const prereqInfo = ctx.courseInfoMap.get(prereqName);
  if (!prereqInfo) return status.passed;

  const diff = ctx.courseSemester - prereqInfo.semester;
  return diff === 1 ? status.listened : status.passed;
};

const evaluateNode = (node: PrereqNode, ctx: EvalContext): boolean => {
  switch (node.type) {
    case 'and':
      return node.children.every((c) => evaluateNode(c, ctx));

    case 'course':
      return isCoursePrereqMet(node.name, ctx);

    case 'credits':
      return ctx.totalCredits >= node.amount;

    case 'none':
      return true;

    case 'or':
      return node.children.some((c) => evaluateNode(c, ctx));

    case 'unknown':
      return true;

    default:
      return true;
  }
};

/**
 * Top-level evaluation: returns `true` when the total credits already
 * reach the 180 override, or when the prerequisite tree is satisfied.
 */
export const isPrerequisiteMet = (
  node: PrereqNode,
  ctx: EvalContext,
): boolean => {
  if (ctx.totalCredits >= OVERRIDE_CREDITS) return true;
  return evaluateNode(node, ctx);
};

const collectCourseNames = (node: PrereqNode): string[] => {
  switch (node.type) {
    case 'and':
    case 'or':
      return node.children.flatMap(collectCourseNames);
    case 'course':
      return [node.name];
    default:
      return [];
  }
};

/**
 * Build a reverse dependency map: for each prerequisite course name,
 * list all courses that depend on it.
 */
export const buildReverseDependencyMap = <
  T extends { name: string; prerequisite: string | undefined },
>(
  courses: T[],
  courseNames: string[],
): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  for (const course of courses) {
    const node = parsePrerequisite(course.prerequisite, courseNames);
    for (const pn of collectCourseNames(node)) {
      let list = map.get(pn);
      if (!list) {
        list = [];
        map.set(pn, list);
      }
      list.push(course);
    }
  }
  return map;
};

/**
 * Build a human-readable status description of each prerequisite node,
 * showing whether it is met or not (with emoji indicators).
 *
 * Elective courses that appear as prerequisites are marked as "not a
 * prerequisite" and skipped.
 */
export const describePrereqNode = (
  node: PrereqNode,
  ctx: EvalContext,
  electives: Set<string>,
): string[] => {
  switch (node.type) {
    case 'and':
      return node.children.flatMap((c) =>
        describePrereqNode(c, ctx, electives),
      );
    case 'course': {
      if (electives.has(node.name)) {
        return [`  \u2796 ${node.name} (изборен \u2014 не е предуслов)`];
      }
      const st = ctx.statuses[node.name];
      const info = ctx.courseInfoMap.get(node.name);
      const diff = info ? ctx.courseSemester - info.semester : 2;
      const needed = diff === 1 ? 'слушан' : 'положен';
      const met = diff === 1 ? (st?.listened ?? false) : (st?.passed ?? false);
      return [
        met
          ? `  \u2705 ${node.name} (${needed})`
          : `  \u274C ${node.name} (потребно: ${needed})`,
      ];
    }
    case 'credits': {
      const met = ctx.totalCredits >= node.amount;
      return [
        met
          ? `  \u2705 ${String(node.amount)} кредити`
          : `  \u274C ${String(node.amount)} кредити (имате ${String(ctx.totalCredits)})`,
      ];
    }
    case 'or': {
      const descs = node.children.map((c) =>
        describePrereqNode(c, ctx, electives),
      );
      const metIdx = descs.findIndex((d) =>
        d.every((line) => line.includes('\u2705')),
      );
      return metIdx === -1 ? descs.flat() : (descs[metIdx] ?? []);
    }
    default:
      return [];
  }
};
