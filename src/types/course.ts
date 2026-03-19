import { z } from 'zod/v4';

const optionalString = z.string().optional();

const courseSchema = z.object({
  '2011/2012': optionalString,
  '2012/2013': optionalString,
  '2013/2014': optionalString,
  '2014/2015': optionalString,
  '2015/2016': optionalString,
  '2016/2017': optionalString,
  '2017/2018': optionalString,
  '2018-available': z.string(),
  '2018-channel': optionalString,
  '2018-code': optionalString,
  '2018-credits': optionalString,
  '2018-level': optionalString,
  '2018-name': optionalString,
  '2018-prerequisite': optionalString,
  '2018-semester': optionalString,
  '2018-state-imb': optionalString,
  '2018-state-ke': optionalString,
  '2018-state-ki': optionalString,
  '2018-state-kn': optionalString,
  '2018-state-pit': optionalString,
  '2018-state-seis': optionalString,
  '2018-state-siis': optionalString,
  '2018/2019': optionalString,
  '2019/2020': optionalString,
  '2020/2021': optionalString,
  '2021/2022': optionalString,
  '2022/2023': optionalString,
  '2023-available': z.string(),
  '2023-channel': optionalString,
  '2023-code': optionalString,
  '2023-credits': optionalString,
  '2023-level': optionalString,
  '2023-name': optionalString,
  '2023-prerequisite': optionalString,
  '2023-semester': optionalString,
  '2023-state-ie': optionalString,
  '2023-state-imb': optionalString,
  '2023-state-ki': optionalString,
  '2023-state-kn': optionalString,
  '2023-state-pit': optionalString,
  '2023-state-seis': optionalString,
  '2023-state-siis': optionalString,
  '2023-state-ssp': optionalString,
  '2023/2024': optionalString,
  '2024/2025': optionalString,
  '2025/2026': optionalString,
  assistants: optionalString,
  channel: optionalString,
  name: z.string(),
  professors: z.string(),
  tags: optionalString,
});

export const coursesSchema = z.array(courseSchema);

export type CourseRaw = z.infer<typeof courseSchema>;

const TAG_TRANSLATIONS: Record<string, string> = {
  ai: 'Вештачка интелигенција',
  coding: 'Кодирање',
  databases: 'Бази на податоци',
  devops: 'DevOps',
  filler: 'Филер',
  math: 'Математика',
  mobile: 'Мобилни',
  networking: 'Мрежи',
  security: 'Безбедност',
  web: 'Веб',
};

export const ALL_TAGS = Object.keys(TAG_TRANSLATIONS);

export const getTagLabel = (tag: string): string =>
  TAG_TRANSLATIONS[tag] ?? tag;

export const getCourseTags = (course: CourseRaw): string[] =>
  course.tags?.split(',').filter(Boolean) ?? [];

export const ACADEMIC_YEARS = [
  '2025/2026',
  '2024/2025',
  '2023/2024',
  '2022/2023',
  '2021/2022',
  '2020/2021',
  '2019/2020',
  '2018/2019',
  '2017/2018',
  '2016/2017',
  '2015/2016',
  '2014/2015',
  '2013/2014',
  '2012/2013',
  '2011/2012',
] as const;

export type AcademicYear = (typeof ACADEMIC_YEARS)[number];

export type AccreditationInfo = {
  channel?: string;
  code?: string;
  level?: string;
  name?: string;
  prerequisite?: string;
  semester?: string;
};

export const getAccreditationInfo = (
  course: CourseRaw,
  accreditation: Accreditation,
): AccreditationInfo | undefined => {
  const available = course[`${accreditation}-available`];
  if (available !== 'TRUE') return undefined;

  return {
    channel: course[`${accreditation}-channel`],
    code: course[`${accreditation}-code`],
    level: course[`${accreditation}-level`],
    name: course[`${accreditation}-name`],
    prerequisite: course[`${accreditation}-prerequisite`],
    semester: course[`${accreditation}-semester`],
  };
};

export const getEnrollmentForYear = (
  course: CourseRaw,
  year: AcademicYear,
): number => {
  const value = course[year];
  return value ? Number.parseInt(value) : 0;
};

const DEFAULT_CREDITS = 6;

export const getCourseCredits = (
  course: CourseRaw,
  accreditation: Accreditation,
): number => {
  const raw = course[`${accreditation}-credits`];
  if (raw) {
    const parsed = Number.parseInt(raw);
    return Number.isNaN(parsed) ? DEFAULT_CREDITS : parsed;
  }
  return DEFAULT_CREDITS;
};

// ---------------------------------------------------------------------------
// Accreditation
// ---------------------------------------------------------------------------

export type Accreditation = '2018' | '2023';

export const isAccreditation = (v: string): v is Accreditation =>
  v === '2018' || v === '2023';

// ---------------------------------------------------------------------------
// Study programs
// ---------------------------------------------------------------------------

const STUDY_PROGRAMS_2018 = [
  'imb',
  'ke',
  'ki',
  'kn',
  'pit',
  'seis',
  'siis',
] as const;

const STUDY_PROGRAMS_2023 = [
  'ie',
  'imb',
  'ki',
  'kn',
  'pit',
  'seis',
  'siis',
  'ssp',
] as const;

export const STUDY_PROGRAM_LABELS: Record<string, string> = {
  ie: 'ИЕ',
  imb: 'ИМБ',
  ke: 'КЕ',
  ki: 'КИ',
  kn: 'КН',
  pit: 'ПИТ',
  seis: 'СЕИС',
  siis: 'СИИС',
  ssp: 'ССП',
};

export const getCourseStateForProgram = (
  course: CourseRaw,
  accreditation: Accreditation,
  program: string,
): string | undefined => {
  const key = `${accreditation}-state-${program}`;
  return key in course ? course[key as keyof CourseRaw] : undefined;
};

export const getStudyPrograms = (
  accreditation: Accreditation,
): readonly string[] =>
  accreditation === '2023' ? STUDY_PROGRAMS_2023 : STUDY_PROGRAMS_2018;

// ---------------------------------------------------------------------------
// Course accessors
// ---------------------------------------------------------------------------

export const getAccLabel = (course: CourseRaw): string => {
  const labels: string[] = [];
  if (getAccreditationInfo(course, '2023')) labels.push('2023');
  if (getAccreditationInfo(course, '2018')) labels.push('2018');
  return labels.join(', ');
};

export const hasChannel = (course: CourseRaw): boolean =>
  course['2023-channel'] === '1' ||
  course['2018-channel'] === '1' ||
  course.channel === 'TRUE';

export const HIGH_ENROLLMENT_THRESHOLD = 200;
