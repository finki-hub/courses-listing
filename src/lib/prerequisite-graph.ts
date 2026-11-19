import { collectCourseNames, parsePrerequisite } from '@/lib/prerequisite';

export type GraphCourse = {
  name: string;
  prerequisite: string | undefined;
  semester: number;
};

export type PrerequisiteGraph = {
  /** Each course's courses, by name, mentioned in its prerequisite. */
  requires: ReadonlyMap<string, readonly string[]>;
  /** Each course's courses that mention it in their prerequisite. */
  unlocks: ReadonlyMap<string, readonly string[]>;
};

/**
 * Links each course to the courses its prerequisite names, both ways.
 *
 * @param courses - One accreditation's courses
 * @returns Both directions of the prerequisite links
 */
export const buildPrerequisiteGraph = (
  courses: readonly GraphCourse[],
): PrerequisiteGraph => {
  const names = courses.map((course) => course.name);
  const requires = new Map<string, string[]>();
  const unlocks = new Map<string, string[]>();
  for (const course of courses) {
    const required = [
      ...new Set(
        collectCourseNames(parsePrerequisite(course.prerequisite, names)),
      ),
    ].filter((name) => name !== course.name);
    requires.set(course.name, required);
    for (const name of required) {
      const list = unlocks.getOrInsert(name, []);
      list.push(course.name);
    }
  }
  return { requires, unlocks };
};

/**
 * The courses reachable from a start course, one layer per step: the first
 * layer is one link away, the next two, and so on. Each course appears once,
 * at its shortest distance, so cycles end.
 *
 * @param start - The course to start from
 * @param links - One direction of the graph
 * @returns Course names per step away from the start
 */
export const collectLayers = (
  start: string,
  links: ReadonlyMap<string, readonly string[]>,
): string[][] => {
  const seen = new Set([start]);
  const layers: string[][] = [];
  let current = [start];
  while (current.length > 0) {
    const next: string[] = [];
    for (const name of current) {
      const linkedNames = links.get(name) ?? [];
      for (const linked of linkedNames) {
        if (seen.has(linked)) continue;
        seen.add(linked);
        next.push(linked);
      }
    }
    if (next.length > 0) layers.push(next);
    current = next;
  }
  return layers;
};

// The course the prerequisite map is centred on, by its link value.
export const PREREQUISITE_FOCUS_PARAM = 'focus';
