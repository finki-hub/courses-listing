import { type Accessor, createEffect, createMemo } from 'solid-js';

import { useMasterData } from '@/data/use-master-data';
import { type SeasonResolver } from '@/lib/course-facts';
import { useLanguage } from '@/lib/LanguageProvider';
import { type ListingFilters } from '@/lib/listing-url-state';
import {
  buildProgramIndex,
  type DegreeProgram,
  formatProgramSummary,
  getMasterCreditOptions,
  getMasterCredits,
  getMasterPrograms,
  getMasterSeason,
  getProgramEntries,
  getProgramTitle,
  isMasterCourse,
  matchesMasterCriteria,
  type ProgramCourse,
  summarizePrograms,
} from '@/lib/master-programs';
import { type CourseRaw } from '@/types/course';

// Filters that need the programs to decide.
export const hasProgramFilters = (filters: ListingFilters): boolean =>
  filters.program !== null ||
  filters.programState !== null ||
  filters.season !== null ||
  filters.credits !== null;

// The courses of each cycle, and for master's courses the programs that
// list them, loaded the first time the master's view is shown.
export const useMasterListing = (
  courses: Accessor<readonly CourseRaw[]>,
  isMaster: Accessor<boolean>,
) => {
  const { language, t } = useLanguage();
  const masterData = useMasterData();

  createEffect(() => {
    if (isMaster()) masterData.request();
  });

  // Reading an errored resource throws: only use it once it is ready.
  const loadedData = () =>
    masterData.data.state === 'ready' ? masterData.data() : undefined;
  const loaded = () => loadedData() !== undefined;

  const masterCourses = createMemo(() => courses().filter(isMasterCourse));
  const undergraduateCourses = createMemo(() =>
    courses().filter((course) => !isMasterCourse(course)),
  );

  const index = createMemo(() =>
    buildProgramIndex(loadedData()?.programCourses ?? []),
  );
  const programs = createMemo(
    () =>
      new Map<string, DegreeProgram>(
        (loadedData()?.programs ?? []).map((program) => [
          program.code,
          program,
        ]),
      ),
  );
  const masterPrograms = createMemo(() =>
    getMasterPrograms(loadedData()?.programs ?? []),
  );

  const entries = (course: CourseRaw): readonly ProgramCourse[] =>
    getProgramEntries(index(), course);
  const getSeason: SeasonResolver = (course) =>
    getMasterSeason(entries(course));
  // A selected program's own credits, else the credits most programs give.
  const getCredits = (
    course: CourseRaw,
    program: null | string = null,
  ): number | undefined => getMasterCredits(entries(course), program);
  const programTitle = (code: string): string =>
    getProgramTitle(programs().get(code), code, language());

  // Program-based filters need the programs: until they load (or when they
  // failed), they match nothing and the results show why.
  const matches = (course: CourseRaw, filters: ListingFilters): boolean =>
    loaded()
      ? matchesMasterCriteria(entries(course), {
          credits: filters.credits,
          kind: filters.programState,
          program: filters.program,
          season: filters.season,
        })
      : !hasProgramFilters(filters);

  return {
    creditOptions: createMemo(() =>
      getMasterCreditOptions(masterCourses(), index()),
    ),
    entries,
    error: () => masterData.data.state === 'errored',
    getCredits,
    getSeason,
    loaded,
    loading: () => masterData.data.loading,
    masterCourses,
    matches,
    programCodes: createMemo(() => masterPrograms().map(({ code }) => code)),
    programOptions: createMemo(() =>
      masterPrograms().map((program) => ({
        label: `${program.code}: ${programTitle(program.code)}`,
        value: program.code,
      })),
    ),
    programTitle,
    request: masterData.request,
    summary: (course: CourseRaw): string =>
      loaded()
        ? formatProgramSummary(
            summarizePrograms(entries(course)),
            t(),
            language(),
          )
        : '',
    undergraduateCourses,
  };
};

export type MasterListing = ReturnType<typeof useMasterListing>;
