import { posthog } from 'posthog-js';
import { createMemo, createSignal, For, type JSX, Show } from 'solid-js';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type CourseFilterCriteria,
  filterCourses,
  type SortColumn,
  sortCourses,
  type SortDirection,
  sortIndicator,
} from '@/lib/course-filters';
import {
  type Accreditation,
  type CourseLevelFilter,
  type CourseRaw,
  type SeasonFilter,
} from '@/types/course';

import { CourseCard } from './course-card';
import { CourseDetailDialog } from './course-detail-dialog';
import { CourseListingControls } from './course-listing-controls';
import { CourseTableRow } from './course-table-row';
import { useCourseSearchAnalytics } from './use-course-search-analytics';

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
  const [selectedCourse, setSelectedCourse] = createSignal<CourseRaw | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [search, setSearch] = createSignal('');
  const [accreditation, setAccreditation] = createSignal<Accreditation | null>(
    null,
  );
  const [seasonFilter, setSeasonFilter] = createSignal<SeasonFilter>(null);
  const [levelFilter, setLevelFilter] = createSignal<CourseLevelFilter>(null);
  const [sortColumn, setSortColumn] = createSignal<SortColumn>('name');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');
  const [selectedTags, setSelectedTags] = createSignal(new Set<string>());

  const toggleTag = (tag: string) => {
    const current = new Set(selectedTags());
    current[current.has(tag) ? 'delete' : 'add'](tag);
    setSelectedTags(current);
  };

  const toggleSort = (column: SortColumn) => {
    if (sortColumn() === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const switchAccreditation = (value: Accreditation) => {
    setAccreditation((current) => (current === value ? null : value));
  };

  const filterCriteria = (): CourseFilterCriteria => ({
    accreditation: accreditation(),
    level: levelFilter(),
    searchTerm: search(),
    season: seasonFilter(),
    tags: selectedTags(),
  });

  const filteredCourses = createMemo(() =>
    sortCourses(
      filterCourses(props.courses, filterCriteria()),
      sortColumn(),
      sortDirection(),
    ),
  );

  useCourseSearchAnalytics(search, () => filteredCourses());
  const openDetail = (course: CourseRaw, position: number) => {
    // eslint-disable-next-line camelcase -- PostHog event props are snake_case
    posthog.capture('result_clicked', { position, result_id: course.name });
    setSelectedCourse(course);
    setDialogOpen(true);
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
              Нема резултати.
            </div>
          }
          when={filteredCourses().length > 0}
        >
          <For each={filteredCourses()}>
            {(course, index) => (
              <CourseCard
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
                Предмет{sortIndicator(sortColumn(), sortDirection(), 'name')}
              </SortableTableHead>
              <SortableTableHead
                class="hidden md:table-cell"
                onClick={() => {
                  toggleSort('accreditation');
                }}
              >
                Акредитација
                {sortIndicator(sortColumn(), sortDirection(), 'accreditation')}
              </SortableTableHead>
              <SortableTableHead
                buttonClass="text-center"
                class="hidden w-20 text-center md:table-cell"
                onClick={() => {
                  toggleSort('channel');
                }}
              >
                Канал (Дискорд)
                {sortIndicator(sortColumn(), sortDirection(), 'channel')}
              </SortableTableHead>
              <SortableTableHead
                class="hidden lg:table-cell"
                onClick={() => {
                  toggleSort('tags');
                }}
              >
                Тагови{sortIndicator(sortColumn(), sortDirection(), 'tags')}
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
                    Нема резултати.
                  </TableCell>
                </TableRow>
              }
              when={filteredCourses().length > 0}
            >
              <For each={filteredCourses()}>
                {(course, index) => (
                  <CourseTableRow
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
        course={selectedCourse()}
        onOpenChange={setDialogOpen}
        open={dialogOpen()}
      />
    </div>
  );
};
