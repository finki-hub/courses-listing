import {
  matchesNormalizedSearch,
  normalizeSearchText,
} from '@/lib/search-normalization';
import {
  type CourseRaw,
  getAccLabel,
  getCourseTags,
  hasChannel,
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

export const filterCourses = (
  courses: CourseRaw[],
  searchTerm: string,
  tags: Set<string>,
): CourseRaw[] => {
  const term = normalizeSearchText(searchTerm);
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

  if (tags.size > 0) {
    filtered = filtered.filter((c) => {
      const courseTags = getCourseTags(c);
      return [...tags].some((t) => courseTags.includes(t));
    });
  }

  return filtered;
};

export const sortCourses = (
  courses: CourseRaw[],
  column: SortColumn,
  direction: SortDirection,
): CourseRaw[] => {
  const dir = direction === 'asc' ? 1 : -1;

  return courses.sort((a, b) => {
    switch (column) {
      case 'accreditation':
        return getAccLabel(a).localeCompare(getAccLabel(b)) * dir;
      case 'channel':
        return (Number(hasChannel(a)) - Number(hasChannel(b))) * dir;
      case 'name':
        return a.name.localeCompare(b.name) * dir;
      case 'tags':
        return (
          getCourseTags(a).join(',').localeCompare(getCourseTags(b).join(',')) *
          dir
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
  return direction === 'asc' ? ' \u2191' : ' \u2193';
};
