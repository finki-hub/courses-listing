import { createMemo, For, Show } from 'solid-js';

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
import { formatCompactYear } from '@/lib/course-offering';
import { interpolate, type Translations } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { SMALL_SCREEN_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { type Accreditation, type CourseRaw } from '@/types/course';

import { CourseCard } from './course-card';
import {
  type CourseColumn,
  type CourseRowFacts,
  CourseTableRow,
} from './course-table-row';

type ColumnHead = CourseColumn & {
  readonly class: string;
  readonly label: (t: Translations, studentsYear?: string) => string;
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
const STUDENTS_HEAD: ColumnHead = {
  cellClass: `${NUMBER_CELL} md:table-cell`,
  class: 'hidden w-32 text-right md:table-cell',
  key: 'students',
  label: (t, year) =>
    year === undefined
      ? t.enrollment.students
      : interpolate(t.listing.studentsYear, {
          year: formatCompactYear(year),
        }),
  sort: 'popularity',
  title: (t) => t.listing.studentsInfo,
};
const SAVE_HEAD: ColumnHead = {
  cellClass: 'hidden w-10 py-0 text-center md:table-cell',
  class: 'hidden w-10 md:table-cell',
  key: 'save',
  label: (t) => t.saved.column,
  labelHidden: true,
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
  STUDENTS_HEAD,
  {
    cellClass: 'hidden xl:table-cell',
    class: 'hidden w-56 xl:table-cell',
    key: 'tags',
    label: (t) => t.common.tags,
  },
  CHANNEL_HEAD,
  SAVE_HEAD,
  OPEN_HEAD,
];

const MASTER_HEADS: readonly ColumnHead[] = [
  NAME_HEAD,
  STUDENTS_HEAD,
  CHANNEL_HEAD,
  SAVE_HEAD,
  OPEN_HEAD,
];

type CourseResultsProps = {
  readonly accreditation: Accreditation | null;
  readonly courses: readonly CourseRaw[];
  readonly getFacts: (course: CourseRaw) => CourseRowFacts;
  readonly isSaved: (course: CourseRaw) => boolean;
  readonly master?: boolean;
  readonly onOpen: (course: CourseRaw, position: number) => void;
  readonly onToggleSaved: (course: CourseRaw) => void;
  readonly onToggleSort: (column: SortColumn) => void;
  readonly sortColumn: SortColumn;
  readonly sortDirection: SortDirection;
  /** The latest year with enrollment, which the Students column counts. */
  readonly studentsYear?: string;
};

// The filtered courses: cards on narrow screens, a sortable table otherwise.
export const CourseResults = (props: CourseResultsProps) => {
  const { t } = useLanguage();
  // One layout at a time: cards on phones, the table from the sm width.
  const wide = useMediaQuery(SMALL_SCREEN_QUERY);
  const heads = () => (props.master ? MASTER_HEADS : UNDERGRADUATE_HEADS);
  const ariaSort = (
    sort: SortColumn | undefined,
  ): 'ascending' | 'descending' | undefined =>
    sort !== undefined && sort === props.sortColumn
      ? ({ asc: 'ascending', desc: 'descending' } as const)[props.sortDirection]
      : undefined;

  return (
    <Show
      fallback={
        <ul class="space-y-2">
          <For each={props.courses}>
            {(course, index) => {
              const facts = createMemo(() => props.getFacts(course));
              return (
                <li>
                  <CourseCard
                    accreditation={props.accreditation}
                    course={course}
                    facts={facts()}
                    onClick={() => {
                      props.onOpen(course, index());
                    }}
                    onToggleSaved={() => {
                      props.onToggleSaved(course);
                    }}
                    saved={props.isSaved(course)}
                  />
                </li>
              );
            }}
          </For>
        </ul>
      }
      when={wide()}
    >
      <div class="bg-card overflow-hidden rounded-lg border">
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
                          {head.label(t(), props.studentsYear)}
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
                          {head.label(t(), props.studentsYear)}
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
              {(course, index) => {
                const facts = createMemo(() => props.getFacts(course));
                return (
                  <CourseTableRow
                    accreditation={props.accreditation}
                    columns={heads()}
                    course={course}
                    facts={facts()}
                    onClick={() => {
                      props.onOpen(course, index());
                    }}
                    onToggleSaved={() => {
                      props.onToggleSaved(course);
                    }}
                    saved={props.isSaved(course)}
                  />
                );
              }}
            </For>
          </TableBody>
        </Table>
      </div>
    </Show>
  );
};
