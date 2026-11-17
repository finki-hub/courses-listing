import { createMemo, For, type JSX, Show } from 'solid-js';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { capture } from '@/lib/analytics-client';
import {
  type CourseFilterCriteria,
  filterCourses,
  sortCourses,
  sortIndicator,
} from '@/lib/course-filters';
import { useLanguage } from '@/lib/LanguageProvider';
import { type CourseRaw } from '@/types/course';

import { CourseCard } from './course-card';
import { CourseDetailDialog } from './course-detail-dialog';
import { CourseListingControls } from './course-listing-controls';
import { CourseTableRow } from './course-table-row';
import { useCourseSearchAnalytics } from './use-course-search-analytics';
import { useLinkedCourseDialog } from './use-linked-course-dialog';
import { useListingState } from './use-listing-state';

type SortableTableHeadProps = {
  buttonClass?: string;
  children: JSX.Element;
  class?: string;
  onClick: () => void;
};

const SortableTableHead = (props: SortableTableHeadProps) => (
  <TableHead class={props.class}>
    <button
      class={`w-full cursor-pointer select-none ${props.buttonClass ?? 'text-left'}`}
      onClick={() => {
        props.onClick();
      }}
      type="button"
    >
      {props.children}
    </button>
  </TableHead>
);

type CourseTableProps = {
  courses: CourseRaw[];
};

export const CourseTable = (props: CourseTableProps) => {
  const { language, t } = useLanguage();

  const {
    accreditation,
    levelFilter,
    search,
    seasonFilter,
    selectedTags,
    setLevelFilter,
    setSearch,
    setSeasonFilter,
    sortColumn,
    sortDirection,
    switchAccreditation,
    toggleSort,
    toggleTag,
  } = useListingState();
  const courseDialog = useLinkedCourseDialog(() => props.courses);

  const filterCriteria = (): CourseFilterCriteria => ({
    accreditation: accreditation(),
    level: levelFilter(),
    searchTerm: search(),
    season: seasonFilter(),
    tags: selectedTags(),
  });

  const filteredCourses = createMemo(() =>
    sortCourses(filterCourses(props.courses, filterCriteria()), {
      accreditation: accreditation(),
      column: sortColumn(),
      direction: sortDirection(),
      language: language(),
    }),
  );

  const searchLinkage = useCourseSearchAnalytics(() => ({
    accreditation: accreditation(),
    level: levelFilter(),
    query: search(),
    resultCount: filteredCourses().length,
    season: seasonFilter(),
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
        accreditation={accreditation()}
        levelFilter={levelFilter()}
        onSearchInput={setSearch}
        onSetLevel={setLevelFilter}
        onSetSeason={setSeasonFilter}
        onSwitchAccreditation={switchAccreditation}
        onToggleSort={toggleSort}
        onToggleTag={toggleTag}
        resultCount={filteredCourses().length}
        search={search()}
        seasonFilter={seasonFilter()}
        selectedTags={selectedTags()}
        sortColumn={sortColumn()}
        sortDirection={sortDirection()}
      />
      {/* Mobile: card layout */}
      <div class="space-y-2 sm:hidden">
        <Show
          fallback={
            <div class="text-muted-foreground py-12 text-center text-sm">
              {t().common.noResults}
            </div>
          }
          when={filteredCourses().length > 0}
        >
          <For each={filteredCourses()}>
            {(course, index) => (
              <CourseCard
                accreditation={accreditation()}
                course={course}
                onClick={() => {
                  openDetail(course, index());
                }}
              />
            )}
          </For>
        </Show>
      </div>

      {/* Desktop: table layout */}
      <div class="hidden rounded-md border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                class="w-75"
                onClick={() => {
                  toggleSort('name');
                }}
              >
                {t().common.course}
                {sortIndicator(sortColumn(), sortDirection(), 'name')}
              </SortableTableHead>
              <SortableTableHead
                class="hidden md:table-cell"
                onClick={() => {
                  toggleSort('accreditation');
                }}
              >
                {t().common.accreditation}
                {sortIndicator(sortColumn(), sortDirection(), 'accreditation')}
              </SortableTableHead>
              <SortableTableHead
                buttonClass="text-center"
                class="hidden w-20 text-center md:table-cell"
                onClick={() => {
                  toggleSort('channel');
                }}
              >
                {t().common.discordChannel}
                {sortIndicator(sortColumn(), sortDirection(), 'channel')}
              </SortableTableHead>
              <SortableTableHead
                class="hidden lg:table-cell"
                onClick={() => {
                  toggleSort('tags');
                }}
              >
                {t().common.tags}
                {sortIndicator(sortColumn(), sortDirection(), 'tags')}
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              fallback={
                <TableRow>
                  <TableCell
                    class="h-24 text-center"
                    colSpan={4}
                  >
                    {t().common.noResults}
                  </TableCell>
                </TableRow>
              }
              when={filteredCourses().length > 0}
            >
              <For each={filteredCourses()}>
                {(course, index) => (
                  <CourseTableRow
                    accreditation={accreditation()}
                    course={course}
                    onClick={() => {
                      openDetail(course, index());
                    }}
                  />
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
      </div>

      <CourseDetailDialog
        accreditation={accreditation()}
        course={courseDialog.course()}
        courses={props.courses}
        onOpenChange={courseDialog.setOpen}
        onOpenCourse={courseDialog.openCourse}
        open={courseDialog.open()}
      />
    </div>
  );
};
