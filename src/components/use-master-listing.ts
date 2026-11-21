import { type Accessor, createEffect, createMemo } from 'solid-js';

import { useMasterData } from '@/data/use-master-data';
import { type SeasonResolver } from '@/lib/course-facts';
import { languageLocales } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type ListingFilters } from '@/lib/listing-url-state';
import { buildCurriculum } from '@/lib/master-curriculum';
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
import { type CourseRaw, getCourseName } from '@/types/course';

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

  createEffect(
    () => isMaster(),
    (masterView) => {
      if (masterView) masterData.request();
    },
  );

  // Reading an errored load returns no data: only use it once it is ready.
  const loadedData = () => masterData.data();
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

  // The course a program's row names: in the row's cycle, else by name.
  const coursesByName = createMemo(() => {
    const byName = new Map<string, CourseRaw>();
    for (const course of courses()) {
      byName.set(`${course.cycle ?? ''}\u{0}${course.name}`, course);
      if (!byName.has(course.name)) byName.set(course.name, course);
    }
    return byName;
  });
  const findCourse = (entry: ProgramCourse): CourseRaw | undefined =>
    coursesByName().get(`${entry.cycle ?? ''}\u{0}${entry.course}`) ??
    coursesByName().get(entry.course);

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
    curriculum: (code: string) =>
      buildCurriculum(loadedData()?.programCourses ?? [], code, {
        locale: languageLocales[language()],
        nameOf: (row) => {
          const course = findCourse(row);
          return course === undefined
            ? row.course
            : getCourseName(course, null, language());
        },
      }),
    entries,
    error: masterData.error,
    findCourse,
    getCredits,
    getSeason,
    loaded,
    loading: masterData.loading,
    masterCourses,
    matches,
    programCodes: createMemo(() => masterPrograms().map(({ code }) => code)),
    programEcts: (code: string): null | number =>
      programs().get(code)?.ects ?? null,
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
