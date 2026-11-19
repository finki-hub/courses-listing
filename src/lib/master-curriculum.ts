import {
  type ElectiveGroupKind,
  getGroupKind,
  GROUP_ORDER,
  isMandatory,
  type ProgramCourse,
} from '@/lib/master-programs';

// A master's program laid out by semester: what is mandatory, then the
// elective lists. The data doesn't say how many electives to take.

export type CurriculumNaming = {
  /** The language whose collation orders the names. */
  readonly locale: string;
  /** The name shown for a row's course. */
  readonly nameOf: (row: ProgramCourse) => string;
};

const DEFAULT_NAMING: CurriculumNaming = {
  locale: 'mk',
  nameOf: (row) => row.course,
};

export type CurriculumGroup = {
  readonly entries: readonly ProgramCourse[];
  readonly kind: ElectiveGroupKind;
  /** The list's own name, for named lists. */
  readonly name: null | string;
};

export type CurriculumSemester = {
  readonly electives: readonly CurriculumGroup[];
  readonly mandatory: readonly ProgramCourse[];
  /** Null for rows the data doesn't place in a semester. */
  readonly semester: null | number;
};

// The long faculty-wide lists start collapsed.
export const isLongGroup = (group: CurriculumGroup): boolean =>
  group.kind === 'facultySummer' || group.kind === 'facultyWinter';

const rowKey = (row: ProgramCourse): string =>
  [row.semester, row.kind, row.group, row.group_name, row.course].join('\u{0}');

const groupElectives = (
  rows: readonly ProgramCourse[],
  naming: CurriculumNaming,
): CurriculumGroup[] => {
  const collator = new Intl.Collator(naming.locale);
  const groups = new Map<
    string,
    { entries: ProgramCourse[]; kind: ElectiveGroupKind; name: null | string }
  >();
  for (const row of rows) {
    const kind = getGroupKind(row.group);
    const name = kind === 'named' ? row.group_name : null;
    const key = `${kind}\u{0}${name ?? ''}`;
    const group = groups.get(key);
    if (group) group.entries.push(row);
    else groups.set(key, { entries: [row], kind, name });
  }
  return Array.from(groups.values(), (group) => ({
    ...group,
    entries: group.entries.toSorted((a, b) =>
      collator.compare(naming.nameOf(a), naming.nameOf(b)),
    ),
  })).toSorted(
    (a, b) =>
      GROUP_ORDER.indexOf(a.kind) - GROUP_ORDER.indexOf(b.kind) ||
      collator.compare(a.name ?? '', b.name ?? ''),
  );
};

// The semesters of one program in order (unplaced rows last). Mandatory
// courses keep the data's order, elective lists are ordered by kind then
// name and their courses by the name shown. Repeated rows are listed once.
export const buildCurriculum = (
  rows: readonly ProgramCourse[],
  program: string,
  naming: CurriculumNaming = DEFAULT_NAMING,
): CurriculumSemester[] => {
  const seen = new Set<string>();
  const bySemester = new Map<null | number, ProgramCourse[]>();
  for (const row of rows) {
    if (row.program !== program || seen.has(rowKey(row))) continue;
    seen.add(rowKey(row));
    const list = bySemester.get(row.semester);
    if (list) list.push(row);
    else bySemester.set(row.semester, [row]);
  }
  return [...bySemester]
    .toSorted(([a], [b]) => (a ?? Infinity) - (b ?? Infinity))
    .map(([semester, list]) => ({
      electives: groupElectives(
        list.filter((row) => !isMandatory(row)),
        naming,
      ),
      mandatory: list.filter(isMandatory),
      semester,
    }));
};

// Only the courses `keep` accepts; lists and semesters left empty go too.
export const filterCurriculum = (
  semesters: readonly CurriculumSemester[],
  keep: (entry: ProgramCourse) => boolean,
): CurriculumSemester[] =>
  semesters
    .map((semester) => ({
      ...semester,
      electives: semester.electives
        .map((group) => ({ ...group, entries: group.entries.filter(keep) }))
        .filter((group) => group.entries.length > 0),
      mandatory: semester.mandatory.filter(keep),
    }))
    .filter(
      (semester) =>
        semester.mandatory.length > 0 || semester.electives.length > 0,
    );
