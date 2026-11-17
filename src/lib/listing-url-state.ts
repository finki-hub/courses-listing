import type {
  ProgramStateFilter,
  SortColumn,
  SortDirection,
  TagMode,
} from '@/lib/course-filters';
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
const TAG_MODE_PARAM = 'tagmode';
const PROGRAM_PARAM = 'prog';
const PROGRAM_STATE_PARAM = 'pstate';
const SEMESTER_PARAM = 'sem';
const CREDITS_PARAM = 'credits';
const STAFF_PARAM = 'staff';
const HIDE_INACTIVE_PARAM = 'hideinactive';
const OFFERED_PARAM = 'offered';
const CHANNEL_PARAM = 'channel';
const SORT_PARAM = 'sort';
const DIRECTION_PARAM = 'dir';

const TAG_SEPARATOR = ',';
const FLAG_VALUE = '1';
const MAX_SEMESTER = 8;
const POSITIVE_INTEGER = /^[1-9]\d*$/u;
const MAX_CREDITS = 60;
const DEFAULT_SORT_COLUMN: SortColumn = 'name';
const DEFAULT_SORT_DIRECTION: SortDirection = 'asc';

// Params owned by the listing filters, dropped when another tab is shown.
export const LISTING_FILTER_PARAMS: readonly string[] = [
  QUERY_PARAM,
  ACCREDITATION_PARAM,
  SEASON_PARAM,
  LEVEL_PARAM,
  TAGS_PARAM,
  TAG_MODE_PARAM,
  PROGRAM_PARAM,
  PROGRAM_STATE_PARAM,
  SEMESTER_PARAM,
  CREDITS_PARAM,
  STAFF_PARAM,
  HIDE_INACTIVE_PARAM,
  OFFERED_PARAM,
  CHANNEL_PARAM,
  SORT_PARAM,
  DIRECTION_PARAM,
];

// Everything the listing filters by. Sorting is kept apart.
export type ListingFilters = {
  accreditation: Accreditation | null;
  channelOnly: boolean;
  credits: null | number;
  hideInactive: boolean;
  level: CourseLevelFilter;
  offeredOnly: boolean;
  program: null | string;
  programState: ProgramStateFilter;
  query: string;
  season: SeasonFilter;
  semester: null | number;
  staff: string;
  tagMode: TagMode;
  tags: string[];
};

export type ListingUrlOptions = {
  readonly programs: readonly string[];
  readonly sortColumns: readonly SortColumn[];
  readonly tags: readonly string[];
};

export type ListingUrlState = ListingFilters & {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
};

export const DEFAULT_LISTING_FILTERS: Readonly<ListingFilters> = {
  accreditation: null,
  channelOnly: false,
  credits: null,
  hideInactive: false,
  level: null,
  offeredOnly: false,
  program: null,
  programState: null,
  query: '',
  season: null,
  semester: null,
  staff: '',
  tagMode: 'any',
  tags: [],
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

// A whole number from 1 to max, written without extra characters.
const parseBoundedInteger = (
  value: null | string,
  max: number,
): null | number => {
  if (value === null || !POSITIVE_INTEGER.test(value)) return null;
  const parsed = Number(value);
  return parsed <= max ? parsed : null;
};

const parseProgramState = (value: null | string): ProgramStateFilter =>
  value === 'elective' || value === 'required' ? value : null;

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

// Any text: the staff filter matches parts of names, like search.
const parseStaff = (value: null | string): string => value?.trim() ?? '';

const parseProgram = (
  value: null | string,
  programs: readonly string[],
): null | string => programs.find((program) => program === value) ?? null;

export const parseListingUrlState = (
  params: URLSearchParams,
  options: ListingUrlOptions,
): ListingUrlState => {
  const program = parseProgram(params.get(PROGRAM_PARAM), options.programs);
  return {
    accreditation: parseAccreditation(params.get(ACCREDITATION_PARAM)),
    channelOnly: params.get(CHANNEL_PARAM) === FLAG_VALUE,
    credits: parseBoundedInteger(params.get(CREDITS_PARAM), MAX_CREDITS),
    hideInactive: params.get(HIDE_INACTIVE_PARAM) === FLAG_VALUE,
    level: parseLevel(params.get(LEVEL_PARAM)),
    offeredOnly: params.get(OFFERED_PARAM) === FLAG_VALUE,
    program,
    // A program state means nothing without its program.
    programState:
      program === null
        ? null
        : parseProgramState(params.get(PROGRAM_STATE_PARAM)),
    query: params.get(QUERY_PARAM) ?? '',
    season: parseSeason(params.get(SEASON_PARAM)),
    semester: parseBoundedInteger(params.get(SEMESTER_PARAM), MAX_SEMESTER),
    sortColumn: parseSortColumn(params.get(SORT_PARAM), options.sortColumns),
    sortDirection: parseSortDirection(params.get(DIRECTION_PARAM)),
    staff: parseStaff(params.get(STAFF_PARAM)),
    tagMode: params.get(TAG_MODE_PARAM) === 'all' ? 'all' : 'any',
    tags: parseTags(params.get(TAGS_PARAM), options.tags),
  };
};

const setOrDelete = (
  params: URLSearchParams,
  key: string,
  value: null | number | string,
): void => {
  if (value === null || value === '') params.delete(key);
  else params.set(key, String(value));
};

const flag = (value: boolean): null | string => (value ? FLAG_VALUE : null);

// Writes the state into params, omitting every value left at its default.
export const writeListingUrlState = (
  params: URLSearchParams,
  state: ListingUrlState,
  options: Pick<ListingUrlOptions, 'tags'>,
): void => {
  const selected = new Set(state.tags);
  const entries: Array<[string, null | number | string]> = [
    [QUERY_PARAM, state.query],
    [ACCREDITATION_PARAM, state.accreditation],
    [SEASON_PARAM, state.season],
    [LEVEL_PARAM, state.level],
    [
      TAGS_PARAM,
      options.tags.filter((tag) => selected.has(tag)).join(TAG_SEPARATOR),
    ],
    [TAG_MODE_PARAM, state.tagMode === 'all' ? 'all' : null],
    [PROGRAM_PARAM, state.program],
    [PROGRAM_STATE_PARAM, state.program === null ? null : state.programState],
    [SEMESTER_PARAM, state.semester],
    [CREDITS_PARAM, state.credits],
    [STAFF_PARAM, state.staff],
    [HIDE_INACTIVE_PARAM, flag(state.hideInactive)],
    [OFFERED_PARAM, flag(state.offeredOnly)],
    [CHANNEL_PARAM, flag(state.channelOnly)],
    [
      SORT_PARAM,
      state.sortColumn === DEFAULT_SORT_COLUMN ? null : state.sortColumn,
    ],
    [
      DIRECTION_PARAM,
      state.sortDirection === DEFAULT_SORT_DIRECTION
        ? null
        : state.sortDirection,
    ],
  ];
  for (const [key, value] of entries) setOrDelete(params, key, value);
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
// Browsers throttle replaceState (Safari throws past ~100 calls in a short
// window); a skipped URL update must never break the UI.
export const replaceUrlParams = (
  update: (params: URLSearchParams) => void,
): void => {
  const url = new URL(location.href);
  update(url.searchParams);
  if (url.href === location.href) return;
  try {
    history.replaceState(history.state, '', url);
  } catch {
    // The next successful update writes the full current state anyway.
  }
};
