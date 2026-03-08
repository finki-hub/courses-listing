import { createMemo, createSignal, For, Show } from 'solid-js';

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
  type SortColumn,
  sortCourses,
  type SortDirection,
  sortIndicator,
} from '@/lib/course-filters';
import { ALL_TAGS, type CourseRaw, getTagLabel } from '@/types/course';

import { CourseDetailDialog } from './course-detail-dialog';
import { CourseTableRow } from './course-table-row';

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
  const [selectedTags, setSelectedTags] = createSignal<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    const current = new Set(selectedTags());
    if (current.has(tag)) {
      current.delete(tag);
    } else {
      current.add(tag);
    }
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

  const handleRowClick = (course: CourseRaw) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  return (
    <div class="space-y-4">
      <SearchInput
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

      <div class="text-muted-foreground text-sm">
        {filteredCourses().length} предмети
      </div>

      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                class="w-75 cursor-pointer select-none"
                onClick={() => {
                  toggleSort('name');
                }}
              >
                Предмет{sortIndicator(sortColumn(), sortDirection(), 'name')}
              </TableHead>
              <TableHead
                class="hidden cursor-pointer select-none md:table-cell"
                onClick={() => {
                  toggleSort('accreditation');
                }}
              >
                Акредитација
                {sortIndicator(sortColumn(), sortDirection(), 'accreditation')}
              </TableHead>
              <TableHead
                class="hidden w-20 cursor-pointer text-center select-none sm:table-cell"
                onClick={() => {
                  toggleSort('channel');
                }}
              >
                Канал (Дискорд)
                {sortIndicator(sortColumn(), sortDirection(), 'channel')}
              </TableHead>
              <TableHead
                class="hidden cursor-pointer select-none lg:table-cell"
                onClick={() => {
                  toggleSort('tags');
                }}
              >
                Тагови{sortIndicator(sortColumn(), sortDirection(), 'tags')}
              </TableHead>
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
                    {/* colSpan covers visible columns on desktop */}
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
                      handleRowClick(course);
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
