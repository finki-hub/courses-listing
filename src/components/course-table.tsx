import { createMemo, createSignal, For, type JSX, Show } from 'solid-js';

import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { SearchInput } from '@/components/ui/search-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  filterCourses,
  SORT_COLUMN_LABELS,
  SORT_COLUMNS,
  type SortColumn,
  sortCourses,
  type SortDirection,
  sortIndicator,
} from '@/lib/course-filters';
import { ALL_TAGS, type CourseRaw, getTagLabel } from '@/types/course';

import { CourseCard } from './course-card';
import { CourseDetailDialog } from './course-detail-dialog';
import { CourseTableRow } from './course-table-row';

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
  const [sortColumn, setSortColumn] = createSignal<SortColumn>('name');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');
  const [selectedTags, setSelectedTags] = createSignal(new Set());

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

  const filteredCourses = createMemo(() =>
    sortCourses(
      filterCourses(props.courses, search(), selectedTags()),
      sortColumn(),
      sortDirection(),
    ),
  );

  const openDetail = (course: CourseRaw) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  return (
    <div class="space-y-4">
      <SearchInput
        aria-label="Пребарувај предмети"
        onInput={(e) => setSearch(e.currentTarget.value)}
        placeholder="Пребарувај предмети..."
        value={search()}
      />

      <div class="flex flex-wrap items-center gap-3">
        <span class="text-muted-foreground text-sm">Тагови:</span>
        <For each={ALL_TAGS}>
          {(tag) => (
            <LabeledCheckbox
              checked={selectedTags().has(tag)}
              class="gap-1.5"
              onChange={() => {
                toggleTag(tag);
              }}
            >
              {getTagLabel(tag)}
            </LabeledCheckbox>
          )}
        </For>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:hidden">
        <span class="text-muted-foreground text-sm">Сортирај:</span>
        <For each={SORT_COLUMNS}>
          {(col) => {
            const isActive = () => sortColumn() === col;
            return (
              <button
                class={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  isActive()
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-foreground hover:bg-muted border-border'
                }`}
                onClick={() => {
                  toggleSort(col);
                }}
                type="button"
              >
                {SORT_COLUMN_LABELS[col]}
                {isActive() && (
                  <span class="text-[10px] leading-none">
                    {sortDirection() === 'asc' ? '\u2191' : '\u2193'}
                  </span>
                )}
              </button>
            );
          }}
        </For>
      </div>
      <div class="text-muted-foreground text-sm">
        {filteredCourses().length} предмети
      </div>
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
            {(course) => (
              <CourseCard
                course={course}
                onClick={() => {
                  openDetail(course);
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
                {(course) => (
                  <CourseTableRow
                    course={course}
                    onClick={() => {
                      openDetail(course);
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
