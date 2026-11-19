import { type SimilarEquivalency } from '@/data/course-similar-equivalencies';
import { normalizeSearchText } from '@/lib/search-normalization';
import { type CourseRaw, getAccreditationInfo } from '@/types/course';

export type EquivalencyCourse = {
  readonly code: string | undefined;
  readonly name: string;
};

// A course offered under both accreditations, by the names each gives it.
export type EquivalencyPair = {
  readonly accreditation2018: EquivalencyCourse;
  readonly accreditation2023: EquivalencyCourse;
  readonly course: CourseRaw;
  readonly renamed: boolean;
  readonly searchText: string;
};

export type EquivalencyView = 'renamed' | 'rules' | 'unchanged';

export const EQUIVALENCY_VIEWS: readonly EquivalencyView[] = [
  'renamed',
  'unchanged',
  'rules',
];

const NAME_COLLATOR = new Intl.Collator('mk');

const toCourse = (
  course: CourseRaw,
  accreditation: '2018' | '2023',
): EquivalencyCourse | undefined => {
  const info = getAccreditationInfo(course, accreditation);
  return info ? { code: info.code, name: info.name ?? course.name } : undefined;
};

// Courses in both accreditations, renamed ones first, each group by the
// name it is shown by.
export const buildEquivalencyPairs = (
  courses: readonly CourseRaw[],
  shown: (name: string) => string = (name) => name,
): EquivalencyPair[] => {
  const pairs: EquivalencyPair[] = [];
  for (const course of courses) {
    const accreditation2018 = toCourse(course, '2018');
    const accreditation2023 = toCourse(course, '2023');
    if (!(accreditation2018 && accreditation2023)) continue;
    pairs.push({
      accreditation2018,
      accreditation2023,
      course,
      renamed: accreditation2018.name !== accreditation2023.name,
      searchText: normalizeSearchText(
        [
          accreditation2018.name,
          accreditation2018.code,
          accreditation2023.name,
          accreditation2023.code,
          course['name-en'],
        ]
          .filter((value) => value !== undefined)
          .join(' '),
      ),
    });
  }
  return pairs.sort(
    (left, right) =>
      Number(right.renamed) - Number(left.renamed) ||
      NAME_COLLATOR.compare(
        shown(left.accreditation2023.name),
        shown(right.accreditation2023.name),
      ),
  );
};

export const pairMatchesView = (
  pair: EquivalencyPair,
  view: EquivalencyView | null,
): boolean => {
  if (view === null) return true;
  if (view === 'rules') return false;
  return pair.renamed === (view === 'renamed');
};

export const getRuleCourses = (rule: SimilarEquivalency) =>
  rule.kind === 'related' ? rule.courses : [...rule.sources, ...rule.targets];

// Whether a rule names a course matching the term, by its name as written,
// the name it is shown by or its code.
export const ruleMatchesSearch = (
  rule: SimilarEquivalency,
  term: string,
  shown: (name: string) => string = (name) => name,
): boolean =>
  !term ||
  getRuleCourses(rule).some((course) =>
    normalizeSearchText(
      `${course.name} ${shown(course.name)} ${course.code}`,
    ).includes(term),
  );

// Combination rules with the same sources become one rule with every target.
export const mergeCombinationRules = (
  rules: readonly SimilarEquivalency[],
): SimilarEquivalency[] => {
  const merged: SimilarEquivalency[] = [];
  const combinationIndexes = new Map<string, number>();

  for (const rule of rules) {
    if (rule.kind !== 'combination') {
      merged.push(rule);
      continue;
    }

    const key = `${rule.accreditation}:${rule.sources.map((course) => course.code).join('|')}`;
    const existingIndex = combinationIndexes.get(key);
    const existing =
      existingIndex === undefined ? undefined : merged[existingIndex];
    if (existing?.kind === 'combination') {
      existing.targets.push(...rule.targets);
      continue;
    }

    combinationIndexes.set(key, merged.length);
    merged.push({ ...rule, targets: [...rule.targets] });
  }

  return merged;
};

// Courses by `accreditation:code`, so a rule's course opens its panel.
export const buildCodeIndex = (
  courses: readonly CourseRaw[],
): Map<string, CourseRaw> => {
  const index = new Map<string, CourseRaw>();
  for (const course of courses) {
    for (const accreditation of ['2018', '2023'] as const) {
      const code = getAccreditationInfo(course, accreditation)?.code;
      if (code) index.set(`${accreditation}:${code}`, course);
    }
  }
  return index;
};
