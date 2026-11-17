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
import {
  type CourseColumn,
  type CourseRowFacts,
  CourseTableRow,
} from './course-table-row';

type ColumnHead = CourseColumn & {
  readonly class: string;
  readonly label: (t: Translations) => string;
  /** Sortable columns sort by this. */
  readonly sort?: SortColumn;
  readonly title?: (t: Translations) => string;
};

const NUMBER_CELL = 'hidden whitespace-nowrap tabular-nums';

const NAME_HEAD: ColumnHead = {
  cellClass: 'font-medium',
  class: 'w-75',
  key: 'name',
  label: (t) => t.common.course,
  sort: 'name',
};
const CREDITS_HEAD: ColumnHead = {
  cellClass: `${NUMBER_CELL} lg:table-cell`,
  class: 'hidden w-20 lg:table-cell',
  key: 'credits',
  label: (t) => t.common.credits,
  sort: 'credits',
};
const STUDENTS_HEAD: ColumnHead = {
  cellClass: `${NUMBER_CELL} md:table-cell`,
  class: 'hidden w-24 md:table-cell',
  key: 'students',
  label: (t) => t.enrollment.students,
  sort: 'popularity',
  title: (t) => t.listing.studentsInfo,
};
const CHANNEL_HEAD: ColumnHead = {
  cellClass: 'hidden whitespace-nowrap text-center md:table-cell',
  class: 'hidden w-20 text-center md:table-cell',
  key: 'channel',
  label: (t) => t.common.discordChannel,
  sort: 'channel',
};

// Desktop columns in display order; narrow widths hide the secondary ones.
const UNDERGRADUATE_HEADS: readonly ColumnHead[] = [
  NAME_HEAD,
  {
    cellClass: 'hidden whitespace-nowrap md:table-cell',
    class: 'hidden md:table-cell',
    key: 'label',
    label: (t) => t.common.accreditation,
    sort: 'accreditation',
  },
  {
    cellClass: `${NUMBER_CELL} md:table-cell`,
    class: 'hidden w-16 md:table-cell',
    key: 'semester',
    label: (t) => t.common.semesterShort,
    sort: 'semester',
  },
  CREDITS_HEAD,
  STUDENTS_HEAD,
  CHANNEL_HEAD,
  {
    cellClass: 'hidden lg:table-cell',
    class: 'hidden lg:table-cell',
    key: 'tags',
    label: (t) => t.common.tags,
    sort: 'tags',
  },
];

const MASTER_HEADS: readonly ColumnHead[] = [
  NAME_HEAD,
  {
    cellClass: 'hidden text-sm md:table-cell',
    class: 'hidden md:table-cell',
    key: 'label',
    label: (t) => t.masters.programs,
  },
  CREDITS_HEAD,
  STUDENTS_HEAD,
  CHANNEL_HEAD,
];

type CourseResultsProps = {
  readonly accreditation: Accreditation | null;
  readonly courses: readonly CourseRaw[];
  readonly getFacts: (course: CourseRaw) => CourseRowFacts;
  readonly master?: boolean;
  readonly onOpen: (course: CourseRaw, position: number) => void;
  readonly onToggleSort: (column: SortColumn) => void;
  readonly sortColumn: SortColumn;
  readonly sortDirection: SortDirection;
};

// The filtered courses: cards on narrow screens, a sortable table otherwise.
export const CourseResults = (props: CourseResultsProps) => {
  const { t } = useLanguage();
  const noResults = () => t().common.noResults;
  const heads = () => (props.master ? MASTER_HEADS : UNDERGRADUATE_HEADS);

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
              <For each={heads()}>
                {(head) => (
                  <TableHead class={head.class}>
                    <Show
                      fallback={head.label(t())}
                      when={head.sort}
                    >
                      {(sort) => (
                        <button
                          class={`w-full cursor-pointer select-none ${
                            head.key === 'channel' ? 'text-center' : 'text-left'
                          }`}
                          onClick={() => {
                            props.onToggleSort(sort());
                          }}
                          title={head.title?.(t())}
                          type="button"
                        >
                          {head.label(t())}
                          {sortIndicator(
                            props.sortColumn,
                            props.sortDirection,
                            sort(),
                          )}
                        </button>
                      )}
                    </Show>
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
                    colSpan={heads().length}
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
                    columns={heads()}
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
