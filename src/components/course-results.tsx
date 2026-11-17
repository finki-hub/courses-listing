import { For, Show } from 'solid-js';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type SortColumn,
  type SortDirection,
  sortIndicator,
} from '@/lib/course-filters';
import { type Translations } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type Accreditation, type CourseRaw } from '@/types/course';

import { CourseCard } from './course-card';
import { type CourseRowFacts, CourseTableRow } from './course-table-row';

type ColumnHead = {
  readonly class: string;
  readonly column: SortColumn;
  readonly label: (t: Translations) => string;
  readonly title?: (t: Translations) => string;
};

// Desktop columns in display order; narrow widths hide the secondary ones.
const COLUMN_HEADS: readonly ColumnHead[] = [
  { class: 'w-75', column: 'name', label: (t) => t.common.course },
  {
    class: 'hidden md:table-cell',
    column: 'accreditation',
    label: (t) => t.common.accreditation,
  },
  {
    class: 'hidden w-16 md:table-cell',
    column: 'semester',
    label: (t) => t.common.semesterShort,
  },
  {
    class: 'hidden w-20 lg:table-cell',
    column: 'credits',
    label: (t) => t.common.credits,
  },
  {
    class: 'hidden w-24 md:table-cell',
    column: 'popularity',
    label: (t) => t.enrollment.students,
    title: (t) => t.listing.studentsInfo,
  },
  {
    class: 'hidden w-20 text-center md:table-cell',
    column: 'channel',
    label: (t) => t.common.discordChannel,
  },
  {
    class: 'hidden lg:table-cell',
    column: 'tags',
    label: (t) => t.common.tags,
  },
];

type CourseResultsProps = {
  readonly accreditation: Accreditation | null;
  readonly courses: readonly CourseRaw[];
  readonly getFacts: (course: CourseRaw) => CourseRowFacts;
  readonly onOpen: (course: CourseRaw, position: number) => void;
  readonly onToggleSort: (column: SortColumn) => void;
  readonly sortColumn: SortColumn;
  readonly sortDirection: SortDirection;
};

// The filtered courses: cards on narrow screens, a sortable table otherwise.
export const CourseResults = (props: CourseResultsProps) => {
  const { t } = useLanguage();
  const noResults = () => t().common.noResults;

  return (
    <>
      <div class="space-y-2 sm:hidden">
        <Show
          fallback={
            <div class="text-muted-foreground py-12 text-center text-sm">
              {noResults()}
            </div>
          }
          when={props.courses.length > 0}
        >
          <For each={props.courses}>
            {(course, index) => (
              <CourseCard
                accreditation={props.accreditation}
                course={course}
                facts={props.getFacts(course)}
                onClick={() => {
                  props.onOpen(course, index());
                }}
              />
            )}
          </For>
        </Show>
      </div>

      <div class="hidden rounded-md border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <For each={COLUMN_HEADS}>
                {(head) => (
                  <TableHead class={head.class}>
                    <button
                      class={`w-full cursor-pointer select-none ${
                        head.column === 'channel' ? 'text-center' : 'text-left'
                      }`}
                      onClick={() => {
                        props.onToggleSort(head.column);
                      }}
                      title={head.title?.(t())}
                      type="button"
                    >
                      {head.label(t())}
                      {sortIndicator(
                        props.sortColumn,
                        props.sortDirection,
                        head.column,
                      )}
                    </button>
                  </TableHead>
                )}
              </For>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              fallback={
                <TableRow>
                  <TableCell
                    class="h-24 text-center"
                    colSpan={COLUMN_HEADS.length}
                  >
                    {noResults()}
                  </TableCell>
                </TableRow>
              }
              when={props.courses.length > 0}
            >
              <For each={props.courses}>
                {(course, index) => (
                  <CourseTableRow
                    accreditation={props.accreditation}
                    course={course}
                    facts={props.getFacts(course)}
                    onClick={() => {
                      props.onOpen(course, index());
                    }}
                  />
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
      </div>
    </>
  );
};
