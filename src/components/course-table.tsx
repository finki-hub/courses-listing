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
  ALL_TAGS,
  type CourseRaw,
  getAccLabel,
  getCourseTags,
  getTagLabel,
  hasChannel,
} from '@/types/course';

import { CourseDetailDialog } from './course-detail-dialog';
import { CourseTableRow } from './course-table-row';

type CourseTableProps = {
  courses: CourseRaw[];
};

type SortColumn = 'accreditation' | 'channel' | 'name' | 'tags';

type SortDirection = 'asc' | 'desc';

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

  const sortIndicator = (column: SortColumn) =>
    sortColumn() === column ? (sortDirection() === 'asc' ? ' ↑' : ' ↓') : '';

  const filteredCourses = createMemo(() => {
    const term = search().toLowerCase();
    const tags = selectedTags();
    let filtered = term
      ? props.courses.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            (c['2023-name']?.toLowerCase().includes(term) ?? false) ||
            (c['2018-name']?.toLowerCase().includes(term) ?? false) ||
            c.professors.toLowerCase().includes(term) ||
            (c.assistants?.toLowerCase().includes(term) ?? false),
        )
      : [...props.courses];

    if (tags.size > 0) {
      filtered = filtered.filter((c) => {
        const courseTags = getCourseTags(c);
        return [...tags].some((t) => courseTags.includes(t));
      });
    }

    const col = sortColumn();
    const dir = sortDirection() === 'asc' ? 1 : -1;

    return filtered.sort((a, b) => {
      if (col === 'channel') {
        return (Number(hasChannel(a)) - Number(hasChannel(b))) * dir;
      }

      let valA: string;
      let valB: string;
      if (col === 'tags') {
        valA = getCourseTags(a).join(',');
        valB = getCourseTags(b).join(',');
      } else {
        valA = col === 'name' ? a.name : getAccLabel(a);
        valB = col === 'name' ? b.name : getAccLabel(b);
      }
      return valA.localeCompare(valB) * dir;
    });
  });

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
                Предмет{sortIndicator('name')}
              </TableHead>
              <TableHead
                class="hidden cursor-pointer select-none md:table-cell"
                onClick={() => {
                  toggleSort('accreditation');
                }}
              >
                Акредитација{sortIndicator('accreditation')}
              </TableHead>
              <TableHead
                class="hidden w-20 cursor-pointer text-center select-none sm:table-cell"
                onClick={() => {
                  toggleSort('channel');
                }}
              >
                Канал (Дискорд){sortIndicator('channel')}
              </TableHead>
              <TableHead
                class="hidden cursor-pointer select-none lg:table-cell"
                onClick={() => {
                  toggleSort('tags');
                }}
              >
                Тагови{sortIndicator('tags')}
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
