/* eslint-disable camelcase -- the data files use snake_case keys. */
import { z } from 'zod/v4';

import type { CourseRaw } from '@/types/course';

import {
  formatCount,
  interpolate,
  type Language,
  type Translations,
} from '@/lib/i18n';

// Master's programs and which courses they list, from the data platform's
// degree_programs.json and degree_program_courses.json.

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

const degreeProgramSchema = z.object({
  code: z.string(),
  cycle: nullableString,
  ects: nullableNumber,
  title: nullableString,
  title_en: nullableString,
});

const programCourseSchema = z.object({
  code: nullableString,
  course: z.string(),
  credits: nullableNumber,
  cycle: nullableString,
  group: nullableString,
  group_name: nullableString,
  kind: z.string(),
  program: z.string(),
  semester: nullableNumber,
});

export const degreeProgramsSchema = z.array(degreeProgramSchema);
export const programCoursesSchema = z.array(programCourseSchema);

export type DegreeProgram = z.infer<typeof degreeProgramSchema>;
export type MasterData = {
  readonly programCourses: readonly ProgramCourse[];
  readonly programs: readonly DegreeProgram[];
};

export type ProgramCourse = z.infer<typeof programCourseSchema>;

export type Season = 'summer' | 'winter';

export const MASTER_CYCLE = 'second';

export const isMasterCourse = (course: CourseRaw): boolean =>
  course.cycle === MASTER_CYCLE;

const CODE_COLLATOR = new Intl.Collator('en');
const NAME_COLLATOR = new Intl.Collator('mk');

const courseKey = (name: string, cycle: null | string | undefined): string =>
  `${cycle ?? ''}\u{0}${name}`;

// Each master's course's rows, joined on name and cycle (a null cycle is a
// course without the key). Undergraduate rows stay out of the master's view.
export const buildProgramIndex = (
  rows: readonly ProgramCourse[],
): ReadonlyMap<string, readonly ProgramCourse[]> => {
  const index = new Map<string, ProgramCourse[]>();
  for (const row of rows) {
    if (row.cycle !== MASTER_CYCLE) continue;
    const key = courseKey(row.course, row.cycle);
    const entries = index.get(key);
    if (entries) entries.push(row);
    else index.set(key, [row]);
  }
  return index;
};

export const getProgramEntries = (
  index: ReadonlyMap<string, readonly ProgramCourse[]>,
  course: CourseRaw,
): readonly ProgramCourse[] =>
  index.get(courseKey(course.name, course.cycle)) ?? [];

export const getMasterPrograms = (
  programs: readonly DegreeProgram[],
): DegreeProgram[] =>
  programs
    .filter((program) => program.cycle === MASTER_CYCLE)
    .toSorted((a, b) => CODE_COLLATOR.compare(a.code, b.code));

// English shows the English title; other languages the Macedonian one,
// falling back to English for programs taught only in English.
export const getProgramTitle = (
  program: DegreeProgram | undefined,
  code: string,
  language: Language,
): string => {
  if (!program) return code;
  const titles =
    language === 'en'
      ? [program.title_en, program.title]
      : [program.title, program.title_en];
  return titles.find((title) => title !== null && title !== '') ?? code;
};

export const isMandatory = (entry: ProgramCourse): boolean =>
  entry.kind === 'mandatory';

// Winter or summer: the elective list says so, else the semester's parity.
export const getEntrySeason = (entry: ProgramCourse): Season | undefined => {
  if (entry.group?.endsWith('_winter')) return 'winter';
  if (entry.group?.endsWith('_summer')) return 'summer';
  if (entry.semester === null) return undefined;
  return entry.semester % 2 === 1 ? 'winter' : 'summer';
};

const mostCommon = <T>(values: readonly T[]): T | undefined => {
  const counts = new Map<T, number>();
  let best: T | undefined;
  let bestCount = 0;
  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1;
    counts.set(value, count);
    if (count <= bestCount) continue;
    best = value;
    bestCount = count;
  }
  return best;
};

// The course's usual season: its mandatory placement, else most programs'.
export const getMasterSeason = (
  entries: readonly ProgramCourse[],
): Season | undefined => {
  const mandatory = entries.filter(isMandatory);
  const source = mandatory.length > 0 ? mandatory : entries;
  return mostCommon(
    source
      .map((entry) => getEntrySeason(entry))
      .filter((season) => season !== undefined),
  );
};

const mostCommonCredits = (
  entries: readonly ProgramCourse[],
): number | undefined =>
  mostCommon(
    entries.map((entry) => entry.credits).filter((credits) => credits !== null),
  );

// The credits a program gives the course; without a program (or when that
// program doesn't list it), the credits most programs give it.
export const getMasterCredits = (
  entries: readonly ProgramCourse[],
  program: null | string = null,
): number | undefined =>
  (program === null
    ? undefined
    : mostCommonCredits(
        entries.filter((entry) => entry.program === program),
      )) ?? mostCommonCredits(entries);

export type ProgramSummary = {
  readonly electiveCount: number;
  readonly mandatory: readonly string[];
};

export const summarizePrograms = (
  entries: readonly ProgramCourse[],
): ProgramSummary => ({
  electiveCount: new Set(
    entries
      .filter((entry) => !isMandatory(entry))
      .map((entry) => entry.program),
  ).size,
  mandatory: [
    ...new Set(entries.filter(isMandatory).map((entry) => entry.program)),
  ].sort((a, b) => CODE_COLLATOR.compare(a, b)),
});

export type MasterCriteria = {
  readonly credits: null | number;
  readonly kind: 'elective' | 'required' | null;
  readonly program: null | string;
  readonly season: null | Season;
};

// The program filter narrows the rows the other filters look at.
export const matchesMasterCriteria = (
  entries: readonly ProgramCourse[],
  criteria: MasterCriteria,
): boolean => {
  const inProgram =
    criteria.program === null
      ? entries
      : entries.filter((entry) => entry.program === criteria.program);
  if (criteria.program !== null && inProgram.length === 0) return false;

  const kindMatches = inProgram.filter(
    (entry) =>
      criteria.kind === null ||
      isMandatory(entry) === (criteria.kind === 'required'),
  );
  if (criteria.kind !== null && kindMatches.length === 0) return false;

  const { season } = criteria;
  const seasonMatches =
    season === null ||
    kindMatches.some((entry) => getEntrySeason(entry) === season);
  // Within a program, the credits of its own (kind-matching) placement.
  const creditsMatch =
    criteria.credits === null ||
    (criteria.program === null
      ? getMasterCredits(entries)
      : mostCommonCredits(kindMatches)) === criteria.credits;
  return seasonMatches && creditsMatch;
};

export const getMasterCreditOptions = (
  courses: readonly CourseRaw[],
  index: ReadonlyMap<string, readonly ProgramCourse[]>,
): number[] =>
  [
    ...new Set(
      courses
        .map((course) => getMasterCredits(getProgramEntries(index, course)))
        .filter((credits) => credits !== undefined),
    ),
  ].sort((a, b) => a - b);

// The elective lists, in display order, keyed as the data names them.
const GROUP_KINDS = {
  faculty_summer: 'facultySummer',
  faculty_winter: 'facultyWinter',
  named: 'named',
  program_summer: 'programSummer',
  program_winter: 'programWinter',
} as const;

export type ElectiveGroupKind =
  'other' | (typeof GROUP_KINDS)[keyof typeof GROUP_KINDS];

const GROUP_ORDER: readonly ElectiveGroupKind[] = [
  'programWinter',
  'programSummer',
  'facultyWinter',
  'facultySummer',
  'named',
  'other',
];

export type ElectiveGroup = {
  readonly entries: readonly ProgramCourse[];
  readonly kind: ElectiveGroupKind;
  /** The list's own name, for named lists. */
  readonly name: null | string;
};

const getGroupKind = (group: null | string): ElectiveGroupKind =>
  group !== null && Object.hasOwn(GROUP_KINDS, group)
    ? GROUP_KINDS[group as keyof typeof GROUP_KINDS]
    : 'other';

const byProgram = (a: ProgramCourse, b: ProgramCourse): number =>
  CODE_COLLATOR.compare(a.program, b.program);

// Mandatory placements first, then electives by the list that offers them.
export const groupProgramEntries = (
  entries: readonly ProgramCourse[],
): {
  electives: ElectiveGroup[];
  mandatory: ProgramCourse[];
} => {
  const groups = new Map<
    string,
    ElectiveGroup & { entries: ProgramCourse[] }
  >();
  for (const entry of entries) {
    if (isMandatory(entry)) continue;
    const kind = getGroupKind(entry.group);
    const name = kind === 'named' ? entry.group_name : null;
    const key = `${kind}\u{0}${name ?? ''}`;
    const group = groups.get(key);
    if (group) group.entries.push(entry);
    else groups.set(key, { entries: [entry], kind, name });
  }

  return {
    electives: Array.from(groups.values(), (group) => ({
      ...group,
      entries: group.entries.toSorted(byProgram),
    })).toSorted(
      (a, b) =>
        GROUP_ORDER.indexOf(a.kind) - GROUP_ORDER.indexOf(b.kind) ||
        NAME_COLLATOR.compare(a.name ?? '', b.name ?? ''),
    ),
    mandatory: entries
      .filter(isMandatory)
      .toSorted(
        (a, b) => byProgram(a, b) || (a.semester ?? 0) - (b.semester ?? 0),
      ),
  };
};

// "Mandatory in DS23_1 · elective in 12 programs", for lists and cards.
export const formatProgramSummary = (
  summary: ProgramSummary,
  t: Translations,
  language: Language,
): string => {
  const parts = [
    summary.mandatory.length > 0
      ? interpolate(t.masters.mandatoryIn, {
          programs: summary.mandatory.join(', '),
        })
      : '',
    summary.electiveCount > 0
      ? formatCount(t.masters.electiveIn, {
          count: summary.electiveCount,
          language,
        })
      : '',
  ].filter((part) => part !== '');
  if (parts.length === 0) return t.masters.noPrograms;
  const text = parts.join(' · ');
  // Each part reads mid-sentence; the summary starts a sentence.
  return `${text.charAt(0).toLocaleUpperCase(language)}${text.slice(1)}`;
};
