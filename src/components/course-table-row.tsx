import { Check } from 'lucide-solid';
import { For, type JSX, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatNumber, getTagLabel } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type Accreditation,
  type CourseRaw,
  getCourseName,
  getCourseTags,
  hasChannel,
} from '@/types/course';

export type CourseColumn = {
  readonly cellClass: string;
  readonly key: CourseColumnKey;
};

export type CourseColumnKey =
  'channel' | 'credits' | 'label' | 'name' | 'semester' | 'students' | 'tags';

// Values shown beside a course: for undergraduate courses by the
// accreditation they are shown by, for master's ones by their programs.
export type CourseRowFacts = {
  readonly credits: number | undefined;
  /** The accreditations, or the programs that list a master's course. */
  readonly label: string;
  /** Master's figures: 0 means not offered or not counted that year. */
  readonly noStudentsAsUnknown?: boolean;
  readonly semester: number | undefined;
  readonly students: number;
};

export const UNKNOWN_STUDENTS = '\u{2013}';

export const hasUnknownStudents = (facts: CourseRowFacts): boolean =>
  facts.noStudentsAsUnknown === true && facts.students === 0;

// The student count, or a dash read aloud as "not offered or no data".
export const StudentCount = (props: { facts: CourseRowFacts }) => {
  const { language, t } = useLanguage();
  return (
    <Show
      fallback={formatNumber(props.facts.students, language())}
      when={hasUnknownStudents(props.facts)}
    >
      <span aria-hidden="true">{UNKNOWN_STUDENTS}</span>
      <span class="sr-only">{t().masters.noEnrollment}</span>
    </Show>
  );
};

type CourseTableRowProps = {
  accreditation: Accreditation | null;
  columns: readonly CourseColumn[];
  course: CourseRaw;
  facts: CourseRowFacts;
  onClick: () => void;
};

export const CourseTableRow = (props: CourseTableRowProps) => {
  const { language, t } = useLanguage();

  const cells: Record<CourseColumnKey, () => JSX.Element> = {
    channel: () => (
      <Show when={hasChannel(props.course)}>
        <Check class="text-primary mx-auto h-4 w-4" />
      </Show>
    ),
    credits: () => <>{props.facts.credits ?? ''}</>,
    label: () => <>{props.facts.label}</>,
    name: () => (
      <>{getCourseName(props.course, props.accreditation, language())}</>
    ),
    semester: () => <>{props.facts.semester ?? ''}</>,
    students: () => <StudentCount facts={props.facts} />,
    tags: () => (
      <div class="flex flex-wrap gap-1">
        <For each={getCourseTags(props.course)}>
          {(tag) => <Badge variant="secondary">{getTagLabel(tag, t())}</Badge>}
        </For>
      </div>
    ),
  };

  return (
    <TableRow
      class="cursor-pointer"
      onClick={props.onClick}
      onKeyDown={(e) => {
        if (!(e.key === 'Enter' || e.key === ' ')) {
          return;
        }

        e.preventDefault();
        props.onClick();
      }}
      role="button"
      tabIndex={0}
    >
      <For each={props.columns}>
        {(column) => (
          <TableCell class={column.cellClass}>{cells[column.key]()}</TableCell>
        )}
      </For>
    </TableRow>
  );
};
