import type { SortColumn, SortDirection } from '@/lib/course-filters';
import type {
  Accreditation,
  CourseLevelFilter,
  CourseRaw,
  SeasonFilter,
} from '@/types/course';

export const COURSE_QUERY_PARAM = 'course';

const QUERY_PARAM = 'q';
const ACCREDITATION_PARAM = 'acc';
const SEASON_PARAM = 'season';
const LEVEL_PARAM = 'level';
const TAGS_PARAM = 'tags';
const SORT_PARAM = 'sort';
const DIRECTION_PARAM = 'dir';

const TAG_SEPARATOR = ',';
const DEFAULT_SORT_COLUMN: SortColumn = 'name';
const DEFAULT_SORT_DIRECTION: SortDirection = 'asc';

// Params owned by the listing filters, dropped when another tab is shown.
export const LISTING_FILTER_PARAMS: readonly string[] = [
  QUERY_PARAM,
  ACCREDITATION_PARAM,
  SEASON_PARAM,
  LEVEL_PARAM,
  TAGS_PARAM,
  SORT_PARAM,
  DIRECTION_PARAM,
];

export type ListingUrlOptions = {
  readonly sortColumns: readonly SortColumn[];
  readonly tags: readonly string[];
};

export type ListingUrlState = {
  accreditation: Accreditation | null;
  level: CourseLevelFilter;
  query: string;
  season: SeasonFilter;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  tags: string[];
};

const parseAccreditation = (value: null | string): Accreditation | null =>
  value === '2018' || value === '2023' ? value : null;

const parseSeason = (value: null | string): SeasonFilter =>
  value === 'summer' || value === 'winter' ? value : null;

const parseLevel = (value: null | string): CourseLevelFilter => {
  if (value === '1') return 1;
  if (value === '2') return 2;
  if (value === '3') return 3;
  return null;
};

const parseSortColumn = (
  value: null | string,
  sortColumns: readonly SortColumn[],
): SortColumn =>
  sortColumns.find((column) => column === value) ?? DEFAULT_SORT_COLUMN;

const parseSortDirection = (value: null | string): SortDirection =>
  value === 'desc' ? 'desc' : DEFAULT_SORT_DIRECTION;

// Known tags in canonical order; unknown and duplicate tags are dropped.
const parseTags = (value: null | string, tags: readonly string[]): string[] => {
  if (!value) return [];
  const requested = new Set(value.split(TAG_SEPARATOR));
  return tags.filter((tag) => requested.has(tag));
};

export const parseListingUrlState = (
  params: URLSearchParams,
  options: ListingUrlOptions,
): ListingUrlState => ({
  accreditation: parseAccreditation(params.get(ACCREDITATION_PARAM)),
  level: parseLevel(params.get(LEVEL_PARAM)),
  query: params.get(QUERY_PARAM) ?? '',
  season: parseSeason(params.get(SEASON_PARAM)),
  sortColumn: parseSortColumn(params.get(SORT_PARAM), options.sortColumns),
  sortDirection: parseSortDirection(params.get(DIRECTION_PARAM)),
  tags: parseTags(params.get(TAGS_PARAM), options.tags),
});

const setOrDelete = (
  params: URLSearchParams,
  key: string,
  value: null | string,
): void => {
  if (value === null || value === '') params.delete(key);
  else params.set(key, value);
};

// Writes the state into params, omitting every value left at its default.
export const writeListingUrlState = (
  params: URLSearchParams,
  state: ListingUrlState,
  options: Pick<ListingUrlOptions, 'tags'>,
): void => {
  const selected = new Set(state.tags);
  setOrDelete(params, QUERY_PARAM, state.query);
  setOrDelete(params, ACCREDITATION_PARAM, state.accreditation);
  setOrDelete(params, SEASON_PARAM, state.season);
  setOrDelete(
    params,
    LEVEL_PARAM,
    state.level === null ? null : String(state.level),
  );
  setOrDelete(
    params,
    TAGS_PARAM,
    options.tags.filter((tag) => selected.has(tag)).join(TAG_SEPARATOR),
  );
  setOrDelete(
    params,
    SORT_PARAM,
    state.sortColumn === DEFAULT_SORT_COLUMN ? null : state.sortColumn,
  );
  setOrDelete(
    params,
    DIRECTION_PARAM,
    state.sortDirection === DEFAULT_SORT_DIRECTION ? null : state.sortDirection,
  );
};

// The stable identifier for a course link: its newest code, else its name.
export const getCourseLinkValue = (course: CourseRaw): string =>
  [course['2023-code'], course['2018-code']].find(
    (code) => code !== undefined && code !== '',
  ) ?? course.name;

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

// Finds a course by either accreditation's code, falling back to any name.
export const findCourseByLinkValue = (
  courses: readonly CourseRaw[],
  value: null | string,
): CourseRaw | undefined => {
  if (!value?.trim()) return undefined;
  const target = normalize(value);
  const byCode = courses.find((course) =>
    [course['2023-code'], course['2018-code']].some(
      (code) => code !== undefined && normalize(code) === target,
    ),
  );
  return (
    byCode ??
    courses.find((course) =>
      [course.name, course['2023-name'], course['2018-name'], course['name-en']]
        .filter((name) => name !== undefined)
        .some((name) => normalize(name) === target),
    )
  );
};

// Applies an update to the current URL's params without a history entry.
export const replaceUrlParams = (
  update: (params: URLSearchParams) => void,
): void => {
  const url = new URL(location.href);
  update(url.searchParams);
  if (url.href !== location.href) {
    history.replaceState(history.state, '', url);
  }
};
