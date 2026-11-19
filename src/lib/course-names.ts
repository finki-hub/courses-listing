import { interpolate, type Language } from '@/lib/i18n';
import { isMasterCourse } from '@/lib/master-programs';
import { findCourseMentions } from '@/lib/prerequisite';
import { type CourseRaw } from '@/types/course';

/** Turns a course's catalog name into the one shown in the language. */
export type CourseNameTranslator = (name: string) => string;

export type PrerequisiteWords = {
  and: string;
  /** With a `{credits}` placeholder for the amount. */
  credits: string;
  or: string;
};

const nameKey = (name: string): string => name.trim().toLowerCase();

// Every Macedonian name a course goes by (its catalog name and each
// accreditation's own) mapped to its official English name. Undergraduate
// courses win a name both cycles use, since the tabs that show translated
// names are undergraduate ones.
export const buildEnglishNameIndex = (
  courses: readonly CourseRaw[],
): ReadonlyMap<string, string> => {
  const index = new Map<string, string>();
  const ordered = [
    ...courses.filter((course) => !isMasterCourse(course)),
    ...courses.filter((course) => isMasterCourse(course)),
  ];
  for (const course of ordered) {
    const english = course['name-en'];
    if (!english) continue;
    for (const name of [
      course.name,
      course['2023-name'],
      course['2018-name'],
    ]) {
      if (!name) continue;
      const key = nameKey(name);
      if (!index.has(key)) index.set(key, english);
    }
  }
  return index;
};

// Only English has official course names; other languages keep the catalog's.
export const translatesCourseNames = (language: Language): boolean =>
  language === 'en';

export const createCourseNameTranslator =
  (index: ReadonlyMap<string, string>): CourseNameTranslator =>
  (name) =>
    index.get(nameKey(name)) ?? name;

const CREDITS_WORD = /(?<!\d)(?<amount>\d+)\s*кредити/gu;
const AND_WORD = /(?<=^|\s|\))и(?=\s|\(|$)/gu;
const OR_WORD = /(?<=^|\s|\))или(?=\s|\(|$)/gu;

export const localizeConnectors = (
  part: string,
  words: PrerequisiteWords,
): string =>
  part
    .replaceAll(CREDITS_WORD, (_match, amount: string) =>
      interpolate(words.credits, { credits: amount }),
    )
    .replaceAll(OR_WORD, () => words.or)
    .replaceAll(AND_WORD, () => words.and);

// A prerequisite as written, with its course names translated and its "и",
// "или" and "N кредити" in the language of the words.
export const localizePrerequisiteText = (
  text: string,
  {
    knownNames,
    translate,
    words,
  }: {
    knownNames: readonly string[];
    translate: CourseNameTranslator;
    words: PrerequisiteWords;
  },
): string => {
  const mentions = findCourseMentions(text, [...knownNames]).toSorted(
    (a, b) => a.start - b.start,
  );
  let result = '';
  let position = 0;
  for (const mention of mentions) {
    result += localizeConnectors(text.slice(position, mention.start), words);
    result += translate(mention.name);
    position = mention.end;
  }
  return result + localizeConnectors(text.slice(position), words);
};
