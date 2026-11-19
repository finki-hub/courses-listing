import {
  parseLevel,
  parseSeason,
  parseTags,
  setOrDelete,
} from '@/lib/listing-url-state';
import {
  COURSE_TYPE_FILTERS,
  type CourseTypeFilter,
} from '@/lib/simulator-view';
import {
  ALL_TAGS,
  type CourseLevelFilter,
  type SeasonFilter,
} from '@/types/course';

export type SimulatorMode = 'checklist' | 'next' | 'plan';

export const SIMULATOR_MODES: readonly SimulatorMode[] = [
  'checklist',
  'next',
  'plan',
];

const VIEW_PARAM = 'view';
const SEARCH_PARAM = 'sq';
const SEASON_PARAM = 'sseason';
const LEVEL_PARAM = 'slevel';
const TYPE_PARAM = 'stype';
const TAGS_PARAM = 'stags';
const ONLY_ENABLED_PARAM = 'sonly';
const TAG_SEPARATOR = ',';
const FLAG_VALUE = '1';

// Params owned by the simulator's view, dropped when another tab is shown.
export const SIMULATOR_VIEW_PARAMS: readonly string[] = [
  VIEW_PARAM,
  SEARCH_PARAM,
  SEASON_PARAM,
  LEVEL_PARAM,
  TYPE_PARAM,
  TAGS_PARAM,
  ONLY_ENABLED_PARAM,
];

export type SimulatorUrlState = {
  level: CourseLevelFilter;
  mode: SimulatorMode;
  search: string;
  season: SeasonFilter;
  showOnlyEnabled: boolean;
  tags: string[];
  type: CourseTypeFilter;
};

export const parseSimulatorUrlState = (
  params: URLSearchParams,
): SimulatorUrlState => {
  const view = params.get(VIEW_PARAM);
  const type = params.get(TYPE_PARAM);
  return {
    level: parseLevel(params.get(LEVEL_PARAM)),
    mode: SIMULATOR_MODES.find((mode) => mode === view) ?? 'checklist',
    search: params.get(SEARCH_PARAM) ?? '',
    season: parseSeason(params.get(SEASON_PARAM)),
    showOnlyEnabled: params.get(ONLY_ENABLED_PARAM) === FLAG_VALUE,
    tags: parseTags(params.get(TAGS_PARAM), ALL_TAGS),
    type: COURSE_TYPE_FILTERS.find((value) => value === type) ?? 'all',
  };
};

// Writes the view into params, omitting every value left at its default.
export const writeSimulatorUrlState = (
  params: URLSearchParams,
  state: SimulatorUrlState,
): void => {
  const selected = new Set(state.tags);
  const entries: Array<[string, null | number | string]> = [
    [VIEW_PARAM, state.mode === 'checklist' ? null : state.mode],
    [SEARCH_PARAM, state.search],
    [SEASON_PARAM, state.season],
    [LEVEL_PARAM, state.level],
    [TYPE_PARAM, state.type === 'all' ? null : state.type],
    [
      TAGS_PARAM,
      ALL_TAGS.filter((tag) => selected.has(tag)).join(TAG_SEPARATOR),
    ],
    [ONLY_ENABLED_PARAM, state.showOnlyEnabled ? FLAG_VALUE : null],
  ];
  for (const [key, value] of entries) setOrDelete(params, key, value);
};
