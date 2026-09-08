import {
  type Accreditation,
  type CourseRaw,
  getAccreditationInfo,
} from '@/types/course';

export type SimilarCourse = { code: string; name: string };

export type SimilarEquivalency =
  | { accreditation: Accreditation; courses: SimilarCourse[]; kind: 'related' }
  | {
      accreditation: Accreditation;
      kind: 'combination' | 'directional';
      sources: SimilarCourse[];
      targets: SimilarCourse[];
    };

type CombinationRule = Extract<CuratedRule, { kind: 'combination' }>;

type CuratedRule =
  | { accreditation: Accreditation; codes: string[]; kind: 'related' }
  | {
      accreditation: Accreditation;
      kind: 'combination';
      sources: string[];
      targets: string[];
    };

const makeCombinationRule = (
  accreditation: Accreditation,
  sources: string[],
  target: string,
): CombinationRule => ({
  accreditation,
  kind: 'combination',
  sources,
  targets: [target],
});

const CURATED_RULES: readonly CuratedRule[] = [
  makeCombinationRule('2023', ['F23L2W031', 'F23L2S032'], 'F23L2W003'),
  makeCombinationRule('2023', ['F23L2W031', 'F23L2S032'], 'F23L2S011'),
  makeCombinationRule('2023', ['F23L2W031', 'F23L2S032'], 'F23L2S001'),
  makeCombinationRule('2018', ['F18L1W031', 'F18L1S032'], 'F18L1W011'),
  makeCombinationRule('2023', ['F23L2W033', 'F23L2S034'], 'F23L2W002'),
  makeCombinationRule('2023', ['F23L2W002'], 'F23L2W033'),
  makeCombinationRule('2018', ['F18L1W033', 'F18L1S034'], 'F18L1S013'),
  makeCombinationRule('2018', ['F18L1S013'], 'F18L1W033'),
  { accreditation: '2023', codes: ['F23L2W201', 'F23L2W001'], kind: 'related' },
  { accreditation: '2023', codes: ['F23L1S003', 'F23L1S045'], kind: 'related' },
  { accreditation: '2018', codes: ['F18L1S003', 'F18L1S045'], kind: 'related' },
  {
    accreditation: '2023',
    codes: ['F23L1S023', 'F23L2W006', 'F23L3W001'],
    kind: 'related',
  },
  { accreditation: '2018', codes: ['F18L1S023', 'F18L2W006'], kind: 'related' },
  { accreditation: '2023', codes: ['F23L2W014', 'F23L2W046'], kind: 'related' },
  { accreditation: '2018', codes: ['F18L2W014', 'F18L2W046'], kind: 'related' },
];

const resolveCourse = (
  byCode: Map<string, CourseRaw>,
  accreditation: Accreditation,
  code: string,
): SimilarCourse | undefined => {
  const course = byCode.get(`${accreditation}:${code}`);
  const info = course ? getAccreditationInfo(course, accreditation) : undefined;
  return info?.code
    ? { code: info.code, name: info.name ?? course?.name ?? code }
    : undefined;
};

/* eslint-disable sonarjs/cognitive-complexity -- curated rules require complete variant validation */
export const resolveSimilarEquivalencies = (
  courses: readonly CourseRaw[],
): SimilarEquivalency[] => {
  const byCode = new Map<string, CourseRaw>();
  for (const course of courses) {
    for (const accreditation of ['2018', '2023'] as const) {
      const code = getAccreditationInfo(course, accreditation)?.code;
      if (code) byCode.set(`${accreditation}:${code}`, course);
    }
  }

  const resolved: SimilarEquivalency[] = [];
  for (const rule of CURATED_RULES) {
    if (rule.kind === 'related') {
      const related = rule.codes.map((code) =>
        resolveCourse(byCode, rule.accreditation, code),
      );
      if (related.every(Boolean)) {
        resolved.push({
          accreditation: rule.accreditation,
          courses: related as SimilarCourse[],
          kind: 'related',
        });
      }
      continue;
    }
    const sources = rule.sources.map((code) =>
      resolveCourse(byCode, rule.accreditation, code),
    );
    const targets = rule.targets.map((code) =>
      resolveCourse(byCode, rule.accreditation, code),
    );
    if (sources.every(Boolean) && targets.every(Boolean)) {
      resolved.push({
        accreditation: rule.accreditation,
        kind: rule.sources.length > 1 ? 'combination' : 'directional',
        sources: sources as SimilarCourse[],
        targets: targets as SimilarCourse[],
      });
    }
  }
  return resolved;
};
/* eslint-enable sonarjs/cognitive-complexity -- end complete variant validation */
