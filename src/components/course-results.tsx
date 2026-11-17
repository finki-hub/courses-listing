import { For, Show } from 'solid-js';

import {
  Table,
  TableBody,
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
  /** Visually hidden header, for columns whose content explains itself. */
  readonly labelHidden?: boolean;
  /** Sortable columns sort by this. */
  readonly sort?: SortColumn;
  readonly title?: (t: Translations) => string;
};

const NUMBER_CELL = 'hidden whitespace-nowrap tabular-nums text-right';

const NAME_HEAD: ColumnHead = {
  cellClass: 'py-2.5',
  class: 'min-w-60',
  key: 'name',
  label: (t) => t.common.course,
  sort: 'name',
};
const CREDITS_HEAD: ColumnHead = {
  cellClass: `${NUMBER_CELL} md:table-cell`,
  class: 'hidden w-20 text-right md:table-cell',
  key: 'credits',
  label: (t) => t.common.credits,
  sort: 'credits',
};
const STUDENTS_HEAD: ColumnHead = {
  cellClass: `${NUMBER_CELL} md:table-cell`,
  class: 'hidden w-24 text-right md:table-cell',
  key: 'students',
  label: (t) => t.enrollment.students,
  sort: 'popularity',
  title: (t) => t.listing.studentsInfo,
};
const CHANNEL_HEAD: ColumnHead = {
  cellClass: 'hidden w-10 text-center md:table-cell',
  class: 'hidden w-10 md:table-cell',
  key: 'channel',
  label: (t) => t.common.discordChannel,
  labelHidden: true,
};
const OPEN_HEAD: ColumnHead = {
  cellClass: 'w-8 pr-3',
  class: 'w-8',
  key: 'open',
  label: (t) => t.common.moreInfo,
  labelHidden: true,
};

// Desktop columns in display order; narrow widths hide the secondary ones.
const UNDERGRADUATE_HEADS: readonly ColumnHead[] = [
  NAME_HEAD,
  {
    cellClass: `${NUMBER_CELL} md:table-cell`,
    class: 'hidden w-16 text-right md:table-cell',
    key: 'semester',
    label: (t) => t.common.semesterShort,
    sort: 'semester',
  },
  CREDITS_HEAD,
  STUDENTS_HEAD,
  {
    cellClass: 'hidden xl:table-cell',
    class: 'hidden w-56 xl:table-cell',
    key: 'tags',
    label: (t) => t.common.tags,
  },
  CHANNEL_HEAD,
  OPEN_HEAD,
];

const MASTER_HEADS: readonly ColumnHead[] = [
  NAME_HEAD,
  CREDITS_HEAD,
  STUDENTS_HEAD,
  CHANNEL_HEAD,
  OPEN_HEAD,
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
  const heads = () => (props.master ? MASTER_HEADS : UNDERGRADUATE_HEADS);
  const ariaSort = (
    sort: SortColumn | undefined,
  ): 'ascending' | 'descending' | undefined =>
    sort !== undefined && sort === props.sortColumn
      ? ({ asc: 'ascending', desc: 'descending' } as const)[props.sortDirection]
      : undefined;

  return (
    <>
      <ul class="space-y-2 sm:hidden">
        <For each={props.courses}>
          {(course, index) => (
            <li>
              <CourseCard
                accreditation={props.accreditation}
                course={course}
                facts={props.getFacts(course)}
                onClick={() => {
                  props.onOpen(course, index());
                }}
              />
            </li>
          )}
        </For>
      </ul>

      <div class="bg-card hidden overflow-hidden rounded-lg border sm:block">
        <Table>
          <TableHeader class="bg-muted/40">
            <TableRow class="hover:bg-transparent">
              <For each={heads()}>
                {(head) => (
                  <TableHead
                    aria-sort={ariaSort(head.sort)}
                    class={head.class}
                  >
                    <Show
                      fallback={
                        <span class={head.labelHidden ? 'sr-only' : undefined}>
                          {head.label(t())}
                        </span>
                      }
                      when={head.sort}
                    >
                      {(sort) => (
                        <button
                          class={`hover:text-foreground w-full cursor-pointer select-none ${
                            head.class.includes('text-right')
                              ? 'text-right'
                              : 'text-left'
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
          </TableBody>
        </Table>
      </div>
    </>
  );
};
