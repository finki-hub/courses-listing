import {
  createEffect,
  createMemo,
  createSignal,
  Show,
  untrack,
} from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { capture } from '@/lib/analytics-client';
import {
  type EnrollmentYears,
  getAllStaff,
  getCourseCode,
  getCourseSemester,
  getCurrentEnrollment,
  getDistinctCredits,
  getLatestEnrollmentYears,
  getPrimaryCredits,
  type SeasonResolver,
} from '@/lib/course-facts';
import {
  type CourseFilterCriteria,
  filterCourses,
  MASTER_SORT_COLUMNS,
  SORT_COLUMNS,
  type SortColumn,
  sortCourses,
  type SortDirection,
} from '@/lib/course-filters';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  clearFilters,
  countActiveFilters,
  removeFilterChip,
} from '@/lib/listing-filter-chips';
import {
  findPreferredCourseByLinkValue,
  type ListingFilters,
} from '@/lib/listing-url-state';
import { isMasterCourse } from '@/lib/master-programs';
import { type CourseRaw, getAccLabel } from '@/types/course';

import { ActiveFilterChips } from './active-filter-chips';
import { CourseDetailDialog } from './course-detail-dialog';
import { CourseResults } from './course-results';
import { type CourseRowFacts } from './course-table-row';
import { FiltersFrame, NoResults } from './listing-filter-frames';
import { ListingFilterPanel } from './listing-filter-panel';
import { ListingToolbar } from './listing-toolbar';
import { useCourseSearchAnalytics } from './use-course-search-analytics';
import { useLinkedCourseDialog } from './use-linked-course-dialog';
import { useListingState } from './use-listing-state';
import {
  hasProgramFilters,
  type MasterListing,
  useMasterListing,
} from './use-master-listing';

// In place of results that need the master's programs to be filtered.
const ProgramsPending = (props: { error: boolean }) => {
  const { t } = useLanguage();
  return (
    <Show
      fallback={
        <p
          class="text-muted-foreground py-12 text-center text-sm"
          role="status"
        >
          {t().masters.loading}
        </p>
      }
      when={props.error}
    >
      <div class={ALERT_STYLES.error}>{t().masters.loadError}</div>
    </Show>
  );
};

// A course name can exist in both cycles: a link resolves within the cycle
// the URL shows first, then within the other one, whose view it then opens.
const useCycleLinkedCourseDialog = (
  courses: () => readonly CourseRaw[],
  listing: ReturnType<typeof useListingState>,
) => {
  const linkedMaster = untrack(listing.filters).cycle === 'master';
  const courseDialog = useLinkedCourseDialog(courses, (list, value) =>
    findPreferredCourseByLinkValue(
      list,
      value,
      (course) => isMasterCourse(course) === linkedMaster,
    ),
  );
  const linked = untrack(courseDialog.course);
  if (linked && isMasterCourse(linked) !== linkedMaster) {
    listing.showLinkedCycle(linkedMaster ? 'undergraduate' : 'master');
  }
  return courseDialog;
};

type FactsDeps = {
  readonly enrollmentYears: () => EnrollmentYears;
  readonly filters: () => ListingFilters;
  readonly getSeason: () => SeasonResolver | undefined;
  readonly master: () => boolean;
  readonly masters: MasterListing;
  /** The courses shown, against whose most popular one bars are drawn. */
  readonly shown: () => readonly CourseRaw[];
};

// What a result row shows beside a course's name.
const createFactsResolver = (deps: FactsDeps) => {
  const getStudents = (course: CourseRaw) =>
    getCurrentEnrollment(course, deps.enrollmentYears(), deps.getSeason());
  const maxStudents = createMemo(() =>
    Math.max(1, ...deps.shown().map((course) => getStudents(course))),
  );

  return (course: CourseRaw): CourseRowFacts => {
    const students = getStudents(course);
    const share = students / maxStudents();
    const { accreditation, program } = deps.filters();
    return deps.master()
      ? {
          credits: deps.masters.getCredits(course, program),
          label: deps.masters.summary(course),
          noStudentsAsUnknown: true,
          semester: undefined,
          share,
          students,
        }
      : {
          code: getCourseCode(course, accreditation),
          credits: getPrimaryCredits(course, accreditation),
          label: getAccLabel(course),
          noStudentsAsUnknown: true,
          semester: getCourseSemester(course, accreditation),
          share,
          students,
        };
  };
};

type AnalyticsDeps = {
  readonly filters: () => ListingFilters;
  readonly resultCount: () => number;
  readonly selectedTags: () => ReadonlySet<string>;
  readonly sortColumn: () => SortColumn;
  readonly sortDirection: () => SortDirection;
};

// Search attempts for analytics; filter values only key them locally.
const useListingSearchAnalytics = (deps: AnalyticsDeps) =>
  useCourseSearchAnalytics(() => {
    const filters = deps.filters();
    return {
      accreditation: filters.accreditation,
      level: filters.level,
      otherFilters: JSON.stringify([
        filters.cycle,
        filters.program,
        filters.programState,
        filters.semester,
        filters.credits,
        filters.staff,
        filters.hideInactive,
        filters.offeredOnly,
        filters.channelOnly,
        filters.tagMode,
      ]),
      query: filters.query,
      resultCount: deps.resultCount(),
      season: filters.season,
      sortColumn: deps.sortColumn(),
      sortDirection: deps.sortDirection(),
      tags: deps.selectedTags(),
    };
  });

// A linked master's program that the data doesn't know matches nothing.
const useDropUnknownProgram = (
  listing: ReturnType<typeof useListingState>,
  masters: MasterListing,
  master: () => boolean,
) => {
  createEffect(() => {
    const program = listing.filters().program;
    if (
      program !== null &&
      master() &&
      masters.loaded() &&
      !masters.programCodes().includes(program)
    ) {
      listing.updateFilters({ program: null, programState: null });
    }
  });
};

// Whether the master's programs are still loading or failed to.
const MasterStatus = (props: { error: boolean; loading: boolean }) => {
  const { t } = useLanguage();
  return (
    <>
      <Show when={props.loading}>
        <p
          class="text-muted-foreground text-sm"
          role="status"
        >
          {t().masters.loading}
        </p>
      </Show>
      <Show when={props.error}>
        <div class={ALERT_STYLES.error}>{t().masters.loadError}</div>
      </Show>
    </>
  );
};

type CourseTableProps = {
  courses: CourseRaw[];
};

export const CourseTable = (props: CourseTableProps) => {
  const { language } = useLanguage();

  const listing = useListingState();
  const { filters, sortColumn, sortDirection, toggleSort } = listing;
  const master = () => filters().cycle === 'master';
  const masters = useMasterListing(() => props.courses, master);

  const courseDialog = useCycleLinkedCourseDialog(() => props.courses, listing);

  const courses = () =>
    master() ? masters.masterCourses() : masters.undergraduateCourses();
  // Program-based filters can't be applied before the programs load.
  const awaitingPrograms = () =>
    master() && !masters.loaded() && hasProgramFilters(filters());
  const getSeason = () => (master() ? masters.getSeason : undefined);

  const enrollmentYears = createMemo(() =>
    getLatestEnrollmentYears(courses(), getSeason()),
  );
  const staff = createMemo(() => getAllStaff(courses()));
  const credits = createMemo(() =>
    master() ? masters.creditOptions() : getDistinctCredits(courses()),
  );
  const selectedTags = createMemo(() => new Set(filters().tags));

  useDropUnknownProgram(listing, masters, master);

  // Below the desktop width the filters open in a sheet.
  const [filtersOpen, setFiltersOpen] = createSignal(false);
  const activeFilters = () => countActiveFilters(filters());

  const filterCriteria = (): CourseFilterCriteria => ({
    ...filters(),
    enrollmentYears: enrollmentYears(),
    getSeason: getSeason(),
    matchesCurriculum: master()
      ? (course) => masters.matches(course, filters())
      : undefined,
    searchTerm: filters().query,
    tags: selectedTags(),
  });

  const filteredCourses = createMemo(() =>
    sortCourses(filterCourses(courses(), filterCriteria()), {
      accreditation: filters().accreditation,
      column: sortColumn(),
      direction: sortDirection(),
      enrollmentYears: enrollmentYears(),
      getCredits: master()
        ? (course) => masters.getCredits(course, filters().program)
        : undefined,
      getSeason: getSeason(),
      language: language(),
    }),
  );

  const getFacts = createFactsResolver({
    enrollmentYears,
    filters,
    getSeason,
    master,
    masters,
    shown: filteredCourses,
  });

  const searchLinkage = useListingSearchAnalytics({
    filters,
    resultCount: () => filteredCourses().length,
    selectedTags,
    sortColumn,
    sortDirection,
  });
  const openDetail = (course: CourseRaw, position: number) => {
    capture('result_clicked', {
      ...searchLinkage(),
      position,
      // eslint-disable-next-line camelcase -- PostHog event props are snake_case
      result_id: course.name,
    });
    courseDialog.openCourse(course);
  };

  const clearAll = () => {
    listing.setFilters(clearFilters(filters()));
  };

  const filterPanel = () => (
    <ListingFilterPanel
      credits={credits()}
      filters={filters()}
      masterPrograms={master() ? masters.programOptions() : undefined}
      onSwitchAccreditation={listing.switchAccreditation}
      onToggleTag={listing.toggleTag}
      onUpdate={listing.updateFilters}
      staff={staff()}
    />
  );

  return (
    <div class="space-y-4">
      <ListingToolbar
        activeFilters={activeFilters()}
        cycle={filters().cycle}
        onOpenFilters={() => {
          setFiltersOpen(true);
        }}
        onSearch={(query) => {
          listing.updateFilters({ query });
        }}
        onSwitchCycle={listing.switchCycle}
        onToggleSort={toggleSort}
        query={filters().query}
        sortColumn={sortColumn()}
        sortColumns={master() ? MASTER_SORT_COLUMNS : SORT_COLUMNS}
        sortDirection={sortDirection()}
      />

      <Show when={master()}>
        <MasterStatus
          error={masters.error() && !awaitingPrograms()}
          loading={masters.loading()}
        />
      </Show>

      <div class="lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        <FiltersFrame
          activeFilters={activeFilters()}
          onClear={clearAll}
          onOpenChange={setFiltersOpen}
          open={filtersOpen()}
          resultCount={
            awaitingPrograms() ? undefined : filteredCourses().length
          }
        >
          {filterPanel()}
        </FiltersFrame>

        <div class="min-w-0 space-y-3">
          <ActiveFilterChips
            filters={filters()}
            onClear={clearAll}
            onRemove={(chip) => {
              listing.setFilters(removeFilterChip(filters(), chip));
            }}
            programLabel={
              master()
                ? (code: string) => `${code}: ${masters.programTitle(code)}`
                : undefined
            }
            resultCount={filteredCourses().length}
          />

          <Show
            fallback={<ProgramsPending error={masters.error()} />}
            when={!awaitingPrograms()}
          >
            <Show
              fallback={
                <NoResults
                  canClear={activeFilters() > 0 || filters().query !== ''}
                  onClear={clearAll}
                />
              }
              when={filteredCourses().length > 0}
            >
              <CourseResults
                accreditation={filters().accreditation}
                courses={filteredCourses()}
                getFacts={getFacts}
                master={master()}
                onOpen={openDetail}
                onToggleSort={toggleSort}
                sortColumn={sortColumn()}
                sortDirection={sortDirection()}
              />
            </Show>
          </Show>
        </div>
      </div>

      <CourseDetailDialog
        accreditation={filters().accreditation}
        course={courseDialog.course()}
        courses={masters.undergraduateCourses()}
        masters={masters}
        onOpenChange={courseDialog.setOpen}
        onOpenCourse={courseDialog.openCourse}
        open={courseDialog.open()}
      />
    </div>
  );
};
