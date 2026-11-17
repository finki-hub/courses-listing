import { type Accessor, createMemo } from 'solid-js';

import {
  getUpcomingSeason,
  rankNextCourses,
  type Season,
} from '@/lib/next-courses';
import { type CourseStatus } from '@/lib/prerequisite';
import { type SimulatorCourse } from '@/lib/simulator';
import { type CourseLevelFilter, type SeasonFilter } from '@/types/course';

type NextCoursesParams = {
  courses: Accessor<SimulatorCourse[]>;
  enabledMap: Accessor<Record<string, boolean>>;
  fullLevels: Accessor<Set<number>>;
  levelFilter: Accessor<CourseLevelFilter>;
  seasonFilter: Accessor<SeasonFilter>;
  statuses: Accessor<Record<string, CourseStatus>>;
};

// The ranked courses for "what can I take next", for the toolbar's season,
// or the upcoming one when none is chosen, and its level filter.
export const useNextCourses = (params: NextCoursesParams) => {
  // eslint-disable-next-line unicorn/prefer-temporal -- Temporal is not yet in every supported browser (Safari), and this build ships no polyfill.
  const upcoming: Season = getUpcomingSeason(new Date().getMonth() + 1);
  const season = (): Season => params.seasonFilter() ?? upcoming;
  const ranked = createMemo(() =>
    rankNextCourses(params.courses(), {
      enabledMap: params.enabledMap(),
      fullLevels: params.fullLevels(),
      level: params.levelFilter(),
      season: season(),
      statuses: params.statuses(),
    }),
  );
  const isUpcoming = () => params.seasonFilter() === null;
  return { isUpcoming, ranked, season };
};
