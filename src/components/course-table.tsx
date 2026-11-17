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
  getAllStaff,
  getCourseSemester,
  getCurrentEnrollment,
  getDistinctCredits,
  getLatestEnrollmentYears,
  getPrimaryCredits,
} from '@/lib/course-facts';
import {
  type CourseFilterCriteria,
  filterCourses,
  MASTER_SORT_COLUMNS,
  SORT_COLUMNS,
  sortCourses,
} from '@/lib/course-filters';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  clearFilters,
  hasMoreFilters,
  removeFilterChip,
} from '@/lib/listing-filter-chips';
import { findPreferredCourseByLinkValue } from '@/lib/listing-url-state';
import { isMasterCourse } from '@/lib/master-programs';
import { type CourseRaw, getAccLabel } from '@/types/course';

import { CourseDetailDialog } from './course-detail-dialog';
import { CourseListingControls } from './course-listing-controls';
import { CourseResults } from './course-results';
import { type CourseRowFacts } from './course-table-row';
import { useCourseSearchAnalytics } from './use-course-search-analytics';
import { useLinkedCourseDialog } from './use-linked-course-dialog';
import { useListingState } from './use-listing-state';
import { hasProgramFilters, useMasterListing } from './use-master-listing';

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

  // A linked master's program that the data doesn't know matches nothing.
  createEffect(() => {
    const program = filters().program;
    if (
      program !== null &&
      master() &&
      masters.loaded() &&
      !masters.programCodes().includes(program)
    ) {
      listing.updateFilters({ program: null, programState: null });
    }
  });

  // Opens by itself when a link arrives with one of its filters set.
  const [moreExpanded, setMoreExpanded] = createSignal(
    hasMoreFilters(untrack(filters)),
  );

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

  const getFacts = (course: CourseRaw): CourseRowFacts => {
    const students = getCurrentEnrollment(
      course,
      enrollmentYears(),
      getSeason(),
    );
    return master()
      ? {
          credits: masters.getCredits(course, filters().program),
          label: masters.summary(course),
          noStudentsAsUnknown: true,
          semester: undefined,
          students,
        }
      : {
          credits: getPrimaryCredits(course, filters().accreditation),
          label: getAccLabel(course),
          semester: getCourseSemester(course, filters().accreditation),
          students,
        };
  };

  const searchLinkage = useCourseSearchAnalytics(() => ({
    accreditation: filters().accreditation,
    level: filters().level,
    otherFilters: JSON.stringify([
      filters().cycle,
      filters().program,
      filters().programState,
      filters().semester,
      filters().credits,
      filters().staff,
      filters().hideInactive,
      filters().offeredOnly,
      filters().channelOnly,
      filters().tagMode,
    ]),
    query: filters().query,
    resultCount: filteredCourses().length,
    season: filters().season,
    sortColumn: sortColumn(),
    sortDirection: sortDirection(),
    tags: selectedTags(),
  }));
  const openDetail = (course: CourseRaw, position: number) => {
    capture('result_clicked', {
      ...searchLinkage(),
      position,
      // eslint-disable-next-line camelcase -- PostHog event props are snake_case
      result_id: course.name,
    });
    courseDialog.openCourse(course);
  };

  return (
    <div class="space-y-4">
      <CourseListingControls
        credits={credits()}
        filters={filters()}
        master={
          master()
            ? {
                // The results say it instead while they wait on programs.
                error: masters.error() && !awaitingPrograms(),
                loading: masters.loading(),
                programLabel: (code: string) =>
                  `${code}: ${masters.programTitle(code)}`,
                programOptions: masters.programOptions(),
              }
            : undefined
        }
        moreExpanded={moreExpanded()}
        onClearFilters={() => {
          listing.setFilters(clearFilters(filters()));
        }}
        onMoreExpandedChange={setMoreExpanded}
        onRemoveChip={(chip) => {
          listing.setFilters(removeFilterChip(filters(), chip));
        }}
        onSwitchAccreditation={listing.switchAccreditation}
        onSwitchCycle={listing.switchCycle}
        onToggleSort={toggleSort}
        onToggleTag={listing.toggleTag}
        onUpdate={listing.updateFilters}
        resultCount={filteredCourses().length}
        sortColumn={sortColumn()}
        sortColumns={master() ? MASTER_SORT_COLUMNS : SORT_COLUMNS}
        sortDirection={sortDirection()}
        staff={staff()}
      />

      <Show
        fallback={<ProgramsPending error={masters.error()} />}
        when={!awaitingPrograms()}
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
