import { createEffect, createMemo, createSignal, untrack } from 'solid-js';

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
import { isMasterCourse } from '@/lib/master-programs';
import { type CourseRaw, getAccLabel } from '@/types/course';

import { CourseDetailDialog } from './course-detail-dialog';
import { CourseListingControls } from './course-listing-controls';
import { CourseResults } from './course-results';
import { type CourseRowFacts } from './course-table-row';
import { useCourseSearchAnalytics } from './use-course-search-analytics';
import { useLinkedCourseDialog } from './use-linked-course-dialog';
import { useListingState } from './use-listing-state';
import { useMasterListing } from './use-master-listing';

type CourseTableProps = {
  courses: CourseRaw[];
};

export const CourseTable = (props: CourseTableProps) => {
  const { language } = useLanguage();

  const listing = useListingState();
  const { filters, sortColumn, sortDirection, toggleSort } = listing;
  const master = () => filters().cycle === 'master';
  const masters = useMasterListing(() => props.courses, master);

  // A course name can exist in both cycles: links prefer the shown cycle.
  const linkedCourses = () =>
    untrack(master)
      ? [...masters.masterCourses(), ...masters.undergraduateCourses()]
      : props.courses;
  const courseDialog = useLinkedCourseDialog(linkedCourses);
  // A link to a master's course opens the master's view.
  const linked = untrack(courseDialog.course);
  if (linked && isMasterCourse(linked) && !untrack(master)) {
    listing.updateFilters({ cycle: 'master' });
  }

  const courses = () =>
    master() ? masters.masterCourses() : masters.undergraduateCourses();
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
      getCredits: master() ? masters.getCredits : undefined,
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
          credits: masters.getCredits(course),
          label: masters.summary(course),
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
                error: masters.error(),
                loading: masters.loading(),
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
