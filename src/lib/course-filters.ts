import {
  matchesNormalizedSearch,
  normalizeSearchText,
} from '@/lib/search-normalization';
import {
  type Accreditation,
  type CourseLevelFilter,
  type CourseRaw,
  getAccLabel,
  getAccreditationInfo,
  getCourseStateForProgram,
  getCourseTags,
  hasChannel,
  type SeasonFilter,
} from '@/types/course';

export type SortColumn = 'accreditation' | 'channel' | 'name' | 'tags';

export type SortDirection = 'asc' | 'desc';

export const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  accreditation: 'Акредитација',
  channel: 'Канал',
  name: 'Предмет',
  tags: 'Тагови',
};

export const SORT_COLUMNS: SortColumn[] = [
  'name',
  'accreditation',
  'channel',
  'tags',
];

export type CourseFilterCriteria = {
  readonly accreditation: Accreditation;
  readonly level: CourseLevelFilter;
  readonly program: string;
  readonly searchTerm: string;
  readonly season: SeasonFilter;
  readonly tags: ReadonlySet<string>;
};

const matchesCurriculumFilters = (
  course: CourseRaw,
  criteria: CourseFilterCriteria,
): boolean => {
  const info = getAccreditationInfo(course, criteria.accreditation);
  if (!info) return false;

  const programState = getCourseStateForProgram(
    course,
    criteria.accreditation,
    criteria.program,
  );
  if (!programState) return false;

  if (criteria.level !== null && info.level !== String(criteria.level)) {
    return false;
  }

  if (criteria.season === null) return true;
  const semester = Number.parseInt(info.semester ?? '', 10);
  return criteria.season === 'winter' ? semester % 2 === 1 : semester % 2 === 0;
};

export const filterCourses = (
  courses: CourseRaw[],
  criteria: CourseFilterCriteria,
): CourseRaw[] => {
  const term = normalizeSearchText(criteria.searchTerm);
  let filtered = term
    ? courses.filter(
        (c) =>
          matchesNormalizedSearch(c.name, term) ||
          (c['2023-name']
            ? matchesNormalizedSearch(c['2023-name'], term)
            : false) ||
          (c['2018-name']
            ? matchesNormalizedSearch(c['2018-name'], term)
            : false) ||
          matchesNormalizedSearch(c.professors, term) ||
          (c.assistants ? matchesNormalizedSearch(c.assistants, term) : false),
      )
    : [...courses];

  filtered = filtered.filter((course) =>
    matchesCurriculumFilters(course, criteria),
  );

  if (criteria.tags.size > 0) {
    filtered = filtered.filter((c) => {
      const courseTags = getCourseTags(c);
      return [...criteria.tags].some((t) => courseTags.includes(t));
    });
  }

  return filtered;
};

const SORT_COLLATOR = new Intl.Collator();

export const sortCourses = (
  courses: CourseRaw[],
  column: SortColumn,
  direction: SortDirection,
): CourseRaw[] => {
  const dir = direction === 'asc' ? 1 : -1;

  return courses.sort((a, b) => {
    switch (column) {
      case 'accreditation':
        return SORT_COLLATOR.compare(getAccLabel(a), getAccLabel(b)) * dir;
      case 'channel':
        return (Number(hasChannel(a)) - Number(hasChannel(b))) * dir;
      case 'name':
        return SORT_COLLATOR.compare(a.name, b.name) * dir;
      case 'tags':
        return (
          SORT_COLLATOR.compare(
            getCourseTags(a).join(','),
            getCourseTags(b).join(','),
          ) * dir
        );
      default:
        return 0;
    }
  });
};

export const sortIndicator = (
  active: SortColumn,
  direction: SortDirection,
  column: SortColumn,
): string => {
  if (active !== column) return '';
  return direction === 'asc' ? ' \u{2191}' : ' \u{2193}';
};
