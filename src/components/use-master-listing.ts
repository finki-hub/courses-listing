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

  const masterCourses = createMemo(() => courses().filter(isMasterCourse));
  const undergraduateCourses = createMemo(() =>
    courses().filter((course) => !isMasterCourse(course)),
  );

  const index = createMemo(() =>
    buildProgramIndex(masterData.data()?.programCourses ?? []),
  );
  const programs = createMemo(
    () =>
      new Map<string, DegreeProgram>(
        (masterData.data()?.programs ?? []).map((program) => [
          program.code,
          program,
        ]),
      ),
  );
  const masterPrograms = createMemo(() =>
    getMasterPrograms(masterData.data()?.programs ?? []),
  );

  const entries = (course: CourseRaw): readonly ProgramCourse[] =>
    getProgramEntries(index(), course);
  const getSeason: SeasonResolver = (course) =>
    getMasterSeason(entries(course));
  const getCredits = (course: CourseRaw): number | undefined =>
    getMasterCredits(entries(course));
  const programTitle = (code: string): string =>
    getProgramTitle(programs().get(code), code, language());

  // Until the programs load, the program-based filters let everything through.
  const matches = (course: CourseRaw, filters: ListingFilters): boolean =>
    masterData.data() === undefined ||
    matchesMasterCriteria(entries(course), {
      credits: filters.credits,
      kind: filters.programState,
      program: filters.program,
      season: filters.season,
    });

  return {
    creditOptions: createMemo(() =>
      getMasterCreditOptions(masterCourses(), index()),
    ),
    entries,
    error: () => masterData.data.error !== undefined,
    getCredits,
    getSeason,
    loaded: () => masterData.data() !== undefined,
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
      masterData.data() === undefined
        ? ''
        : formatProgramSummary(
            summarizePrograms(entries(course)),
            t(),
            language(),
          ),
    undergraduateCourses,
  };
};

export type MasterListing = ReturnType<typeof useMasterListing>;
