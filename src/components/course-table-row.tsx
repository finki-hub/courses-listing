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
  readonly semester: number | undefined;
  readonly students: number;
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
    students: () => <>{formatNumber(props.facts.students, language())}</>,
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
