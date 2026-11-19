import { findCourseMentions } from '@/lib/prerequisite';
import { getProgramStateKind, type ProgramStateKind } from '@/lib/simulator';
import {
  type Accreditation,
  type CourseRaw,
  getAccreditationInfo,
  getCourseCredits,
  getCourseStateForProgram,
  getStudyPrograms,
  STUDY_PROGRAM_LABELS,
} from '@/types/course';

export type AccreditationDetails = {
  accreditation: Accreditation;
  channel: boolean;
  code: string | undefined;
  credits: number;
  level: string | undefined;
  name: string | undefined;
  prerequisite: string | undefined;
  programGroups: ProgramStateGroup[];
  semester: string | undefined;
};

export type PrerequisiteSegment = { course?: string; text: string };

export type ProgramStateGroup = {
  kind: ProgramStateKind;
  programs: Array<{ label: string; state: string }>;
};

const PROGRAM_STATE_ORDER: readonly ProgramStateKind[] = [
  'required',
  'required-4yr',
  'elective',
  'faculty-list',
];

const CHANNEL_VALUES: ReadonlySet<string> = new Set(['1', 'TRUE']);

// The study programs of an accreditation, grouped by how they offer the course.
export const getProgramStateGroups = (
  course: CourseRaw,
  accreditation: Accreditation,
): ProgramStateGroup[] => {
  const groups = new Map<ProgramStateKind, ProgramStateGroup['programs']>();
  for (const program of getStudyPrograms(accreditation)) {
    const state = getCourseStateForProgram(course, accreditation, program);
    const kind = getProgramStateKind(state);
    if (state === undefined || kind === undefined) continue;
    const label = STUDY_PROGRAM_LABELS[program] ?? program;
    groups.set(kind, [...(groups.get(kind) ?? []), { label, state }]);
  }

  return PROGRAM_STATE_ORDER.filter((kind) => groups.has(kind)).map((kind) => ({
    kind,
    programs: groups.get(kind) ?? [],
  }));
};

export const getAccreditationDetails = (
  course: CourseRaw,
  accreditation: Accreditation,
): AccreditationDetails | undefined => {
  const info = getAccreditationInfo(course, accreditation);
  if (!info) return undefined;

  return {
    accreditation,
    channel: CHANNEL_VALUES.has(info.channel ?? ''),
    code: info.code,
    credits: getCourseCredits(course, accreditation),
    level: info.level,
    name: info.name,
    prerequisite: info.prerequisite,
    programGroups: getProgramStateGroups(course, accreditation),
    semester: info.semester,
  };
};

const MERGE_FIELDS = [
  'channel',
  'credits',
  'level',
  'name',
  'prerequisite',
  'semester',
] as const satisfies ReadonlyArray<keyof AccreditationDetails>;

// Two accreditations can share one card when everything but the code and the
// program offerings is the same.
export const canMergeAccreditationDetails = (
  first: AccreditationDetails,
  second: AccreditationDetails,
): boolean => MERGE_FIELDS.every((field) => first[field] === second[field]);

// Splits prerequisite text into plain text and known course names, keeping the
// source text exactly as supplied.
export const linkPrerequisiteText = (
  text: string,
  knownCourseNames: string[],
): PrerequisiteSegment[] => {
  const mentions = findCourseMentions(text, knownCourseNames).toSorted(
    (a, b) => a.start - b.start,
  );
  const segments: PrerequisiteSegment[] = [];
  let position = 0;

  for (const { end, name, start } of mentions) {
    if (start > position) segments.push({ text: text.slice(position, start) });
    segments.push({ course: name, text: text.slice(start, end) });
    position = end;
  }
  if (position < text.length) segments.push({ text: text.slice(position) });

  return segments;
};

// Each accreditation's courses by the name its prerequisites use.
export const indexCoursesByName = (
  courses: CourseRaw[],
  accreditation: Accreditation,
): Map<string, CourseRaw> => {
  const index = new Map<string, CourseRaw>();
  for (const course of courses) {
    const info = getAccreditationInfo(course, accreditation);
    if (info) index.set(info.name ?? course.name, course);
  }
  return index;
};

// One field's values across accreditations, with the accreditations that
// share each, so a value both agree on is shown once.
export type DetailValue = { accreditations: Accreditation[]; value: string };

export const groupDetailValues = (
  details: readonly AccreditationDetails[],
  pick: (entry: AccreditationDetails) => number | string | undefined,
): DetailValue[] => {
  const groups = new Map<string, Accreditation[]>();
  for (const entry of details) {
    const raw = pick(entry);
    const value = raw === undefined ? '' : String(raw).trim();
    if (value === '') continue;
    groups.set(value, [...(groups.get(value) ?? []), entry.accreditation]);
  }
  return [...groups].map(([value, accreditations]) => ({
    accreditations,
    value,
  }));
};
