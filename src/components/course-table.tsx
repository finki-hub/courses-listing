import {
  createEffect,
  createMemo,
  createSignal,
  Show,
  untrack,
} from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { capture } from '@/lib/analytics-client';
import { useAppNavigation } from '@/lib/app-navigation';
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
import { getOffering } from '@/lib/course-offering';
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
import { isMasterCourse, type ProgramCourse } from '@/lib/master-programs';
import { useSavedCourses } from '@/lib/saved-courses-store';
import { type CourseRaw, getAccLabel } from '@/types/course';

import { ActiveFilterChips } from './active-filter-chips';
import { CourseDetailDialog } from './course-detail-dialog';
import { CourseResults } from './course-results';
import { type CourseRowFacts } from './course-table-row';
import { FiltersFrame, NoResults } from './listing-filter-frames';
import { ListingFilterPanel } from './listing-filter-panel';
import { ListingToolbar } from './listing-toolbar';
import {
  MasterCurriculumView,
  MasterViewSwitch,
} from './master-curriculum-view';
import { SharedSavedBanner } from './saved-courses-ui';
import { useCourseSearchAnalytics } from './use-course-search-analytics';
import { useLinkedCourseDialog } from './use-linked-course-dialog';
import { useListingState } from './use-listing-state';
import {
  hasProgramFilters,
  type MasterListing,
  useMasterListing,
} from './use-master-listing';
import { useSavedListing } from './use-saved-listing';

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
          offering: getOffering(course, deps.enrollmentYears()),
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
  createEffect(
    () =>
      [
        listing.filters().program,
        master(),
        masters.loaded(),
        masters.programCodes(),
      ] as const,
    ([program, isMaster, loaded, codes]) => {
      if (program !== null && isMaster && loaded && !codes.includes(program)) {
        listing.updateFilters({ program: null, programState: null });
      }
    },
  );
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

type FilteredDeps = {
  readonly courses: () => CourseRaw[];
  readonly enrollmentYears: () => EnrollmentYears;
  readonly filters: () => ListingFilters;
  readonly getSeason: () => SeasonResolver | undefined;
  readonly master: () => boolean;
  readonly masters: MasterListing;
  readonly savedValues: () => ReadonlySet<string> | undefined;
  readonly selectedTags: () => ReadonlySet<string>;
  readonly sortColumn: () => SortColumn;
  readonly sortDirection: () => SortDirection;
};

// The courses matching the filters and search, in the chosen order.
const createFilteredCourses = (deps: FilteredDeps) => {
  const { language } = useLanguage();
  const criteria = (): CourseFilterCriteria => ({
    ...deps.filters(),
    enrollmentYears: deps.enrollmentYears(),
    getSeason: deps.getSeason(),
    matchesCurriculum: deps.master()
      ? (course) => deps.masters.matches(course, deps.filters())
      : undefined,
    savedValues: deps.savedValues(),
    searchTerm: deps.filters().query,
    tags: deps.selectedTags(),
  });
  return createMemo(() =>
    sortCourses(filterCourses(deps.courses(), criteria()), {
      accreditation: deps.filters().accreditation,
      column: deps.sortColumn(),
      direction: deps.sortDirection(),
      enrollmentYears: deps.enrollmentYears(),
      getCredits: deps.master()
        ? (course) => deps.masters.getCredits(course, deps.filters().program)
        : undefined,
      getSeason: deps.getSeason(),
      language: language(),
    }),
  );
};

type OpeningDeps = AnalyticsDeps & {
  readonly courseDialog: ReturnType<typeof useLinkedCourseDialog>;
};

// Opens a result's details, noting which search led to it.
const useResultOpening = (deps: OpeningDeps) => {
  const searchLinkage = useListingSearchAnalytics(deps);
  return (course: CourseRaw, position: number) => {
    capture('result_clicked', {
      ...searchLinkage(),
      position,
      // eslint-disable-next-line camelcase -- PostHog event props are snake_case
      result_id: course.name,
    });
    deps.courseDialog.openCourse(course);
  };
};

type CurriculumDeps = {
  readonly filteredCourses: () => readonly CourseRaw[];
  readonly listing: ReturnType<typeof useListingState>;
  readonly masters: MasterListing;
};

// The curriculum layout follows the listing's filters: it keeps the program
// rows whose course is in the filtered results. Rows with no master's course
// show only while nothing narrows the listing.
const useCurriculumLayout = (deps: CurriculumDeps) => {
  const { filters } = deps.listing;
  const shownCourses = createMemo(() => new Set(deps.filteredCourses()));
  // The program is always a filter here; anything more narrows the courses.
  const narrowed = () =>
    countActiveFilters(filters()) > 1 || filters().query !== '';
  return {
    clear: () => {
      deps.listing.setFilters({
        ...clearFilters(filters()),
        program: filters().program,
      });
    },
    keep: (entry: ProgramCourse): boolean => {
      const course = deps.masters.findCourse(entry);
      return course !== undefined && isMasterCourse(course)
        ? shownCourses().has(course)
        : !narrowed();
    },
    narrowed,
    shown: () =>
      filters().cycle === 'master' && filters().view === 'curriculum',
  };
};

type TableToolbarProps = {
  readonly activeFilters: number;
  readonly listing: ReturnType<typeof useListingState>;
  readonly master: boolean;
  readonly onOpenFilters: () => void;
  readonly showSort: boolean;
  readonly studentsYear: string | undefined;
};

// The cycle, search and sort controls above the listing.
const TableToolbar = (props: TableToolbarProps) => (
  <ListingToolbar
    activeFilters={props.activeFilters}
    cycle={props.listing.filters().cycle}
    onOpenFilters={props.onOpenFilters}
    onSearch={(query) => {
      props.listing.updateFilters({ query });
    }}
    onSwitchCycle={props.listing.switchCycle}
    onToggleSort={props.listing.toggleSort}
    query={props.listing.filters().query}
    showSort={props.showSort}
    sortColumn={props.listing.sortColumn()}
    sortColumns={props.master ? MASTER_SORT_COLUMNS : SORT_COLUMNS}
    sortDirection={props.listing.sortDirection()}
    studentsYear={props.studentsYear}
  />
);

type TableFilterPanelProps = {
  readonly credits: readonly number[];
  readonly listing: ReturnType<typeof useListingState>;
  /** The master's listing, for the master's cycle. */
  readonly masters: MasterListing | undefined;
  readonly saved: ReturnType<typeof useSavedListing>;
  readonly staff: readonly string[];
};

// Every listing filter, for the sidebar or the sheet.
const TableFilterPanel = (props: TableFilterPanelProps) => (
  <ListingFilterPanel
    credits={props.credits}
    filters={props.listing.filters()}
    masterPrograms={props.masters?.programOptions()}
    onShareSaved={props.saved.share}
    onSwitchAccreditation={props.listing.switchAccreditation}
    onToggleTag={props.listing.toggleTag}
    onUpdate={props.listing.updateFilters}
    savedCount={props.saved.ownCount()}
    staff={props.staff}
  />
);

type CourseTableProps = {
  courses: CourseRaw[];
};

export const CourseTable = (props: CourseTableProps) => {
  const listing = useListingState();
  const { filters, sortColumn, sortDirection, toggleSort } = listing;
  const master = () => filters().cycle === 'master';
  const masters = useMasterListing(() => props.courses, master);

  const courseDialog = useCycleLinkedCourseDialog(() => props.courses, listing);
  const navigation = useAppNavigation();
  const savedCourses = useSavedCourses();
  const savedListing = useSavedListing({
    courses: () => props.courses,
    listing,
  });

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

  const filteredCourses = createFilteredCourses({
    courses,
    enrollmentYears,
    filters,
    getSeason,
    master,
    masters,
    savedValues: savedListing.filterValues,
    selectedTags,
    sortColumn,
    sortDirection,
  });

  const getFacts = createFactsResolver({
    enrollmentYears,
    filters,
    getSeason,
    master,
    masters,
    shown: filteredCourses,
  });

  const openDetail = useResultOpening({
    ...listing,
    courseDialog,
    resultCount: () => filteredCourses().length,
    selectedTags,
  });

  const curriculum = useCurriculumLayout({ filteredCourses, listing, masters });

  const clearAll = () => {
    listing.setFilters(clearFilters(filters()));
  };

  const filterPanel = () => (
    <TableFilterPanel
      credits={credits()}
      listing={listing}
      masters={master() ? masters : undefined}
      saved={savedListing}
      staff={staff()}
    />
  );

  return (
    <div class="space-y-4">
      <TableToolbar
        activeFilters={activeFilters()}
        listing={listing}
        master={master()}
        onOpenFilters={() => {
          setFiltersOpen(true);
        }}
        showSort={!curriculum.shown()}
        studentsYear={master() ? undefined : enrollmentYears().all}
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
          <SharedSavedBanner saved={savedListing} />
          <Show when={master()}>
            <MasterViewSwitch
              onSelect={(view) => {
                listing.updateFilters({ view });
              }}
              value={filters().view}
            />
          </Show>

          <Show
            fallback={
              <MasterCurriculumView
                canClear={curriculum.narrowed()}
                keep={curriculum.keep}
                masters={masters}
                onClear={curriculum.clear}
                onOpen={courseDialog.openCourse}
                program={filters().program}
              />
            }
            when={!curriculum.shown()}
          >
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
                    noneSaved={
                      filters().savedOnly && savedListing.effective().size === 0
                    }
                    onClear={clearAll}
                  />
                }
                when={filteredCourses().length > 0}
              >
                <CourseResults
                  accreditation={filters().accreditation}
                  courses={filteredCourses()}
                  getFacts={getFacts}
                  isSaved={savedCourses.isSaved}
                  master={master()}
                  onOpen={openDetail}
                  onToggleSaved={savedCourses.toggle}
                  onToggleSort={toggleSort}
                  sortColumn={sortColumn()}
                  sortDirection={sortDirection()}
                  studentsYear={master() ? undefined : enrollmentYears().all}
                />
              </Show>
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
        onShowPrerequisites={navigation?.showPrerequisites}
        open={courseDialog.open()}
      />
    </div>
  );
};
