import { createMemo, createSignal, untrack } from 'solid-js';

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
  sortCourses,
} from '@/lib/course-filters';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  clearFilters,
  hasMoreFilters,
  removeFilterChip,
} from '@/lib/listing-filter-chips';
import { type CourseRaw } from '@/types/course';

import { CourseDetailDialog } from './course-detail-dialog';
import { CourseListingControls } from './course-listing-controls';
import { CourseResults } from './course-results';
import { type CourseRowFacts } from './course-table-row';
import { useCourseSearchAnalytics } from './use-course-search-analytics';
import { useLinkedCourseDialog } from './use-linked-course-dialog';
import { useListingState } from './use-listing-state';

type CourseTableProps = {
  courses: CourseRaw[];
};

export const CourseTable = (props: CourseTableProps) => {
  const { language } = useLanguage();

  const listing = useListingState(() => props.courses);
  const { filters, sortColumn, sortDirection, toggleSort } = listing;
  const courseDialog = useLinkedCourseDialog(() => props.courses);

  const enrollmentYears = createMemo(() =>
    getLatestEnrollmentYears(props.courses),
  );
  const staff = createMemo(() => getAllStaff(props.courses));
  const credits = createMemo(() => getDistinctCredits(props.courses));
  const selectedTags = createMemo(() => new Set(filters().tags));

  // Opens by itself when a link arrives with one of its filters set.
  const [moreExpanded, setMoreExpanded] = createSignal(
    hasMoreFilters(untrack(filters)),
  );

  const filterCriteria = (): CourseFilterCriteria => ({
    ...filters(),
    enrollmentYears: enrollmentYears(),
    searchTerm: filters().query,
    tags: selectedTags(),
  });

  const filteredCourses = createMemo(() =>
    sortCourses(filterCourses(props.courses, filterCriteria()), {
      accreditation: filters().accreditation,
      column: sortColumn(),
      direction: sortDirection(),
      enrollmentYears: enrollmentYears(),
      language: language(),
    }),
  );

  const getFacts = (course: CourseRaw): CourseRowFacts => ({
    credits: getPrimaryCredits(course, filters().accreditation),
    semester: getCourseSemester(course, filters().accreditation),
    students: getCurrentEnrollment(course, enrollmentYears()),
  });

  const searchLinkage = useCourseSearchAnalytics(() => ({
    accreditation: filters().accreditation,
    level: filters().level,
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
        moreExpanded={moreExpanded()}
        onClearFilters={() => {
          listing.setFilters(clearFilters(filters()));
        }}
        onMoreExpandedChange={setMoreExpanded}
        onRemoveChip={(chip) => {
          listing.setFilters(removeFilterChip(filters(), chip));
        }}
        onSwitchAccreditation={listing.switchAccreditation}
        onToggleSort={toggleSort}
        onToggleTag={listing.toggleTag}
        onUpdate={listing.updateFilters}
        resultCount={filteredCourses().length}
        sortColumn={sortColumn()}
        sortDirection={sortDirection()}
        staff={staff()}
      />

      <CourseResults
        accreditation={filters().accreditation}
        courses={filteredCourses()}
        getFacts={getFacts}
        onOpen={openDetail}
        onToggleSort={toggleSort}
        sortColumn={sortColumn()}
        sortDirection={sortDirection()}
      />

      <CourseDetailDialog
        accreditation={filters().accreditation}
        course={courseDialog.course()}
        courses={props.courses}
        onOpenChange={courseDialog.setOpen}
        onOpenCourse={courseDialog.openCourse}
        open={courseDialog.open()}
      />
    </div>
  );
};
