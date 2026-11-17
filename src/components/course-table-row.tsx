import { Check } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatNumber, getTagLabel } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type Accreditation,
  type CourseRaw,
  getAccLabel,
  getCourseName,
  getCourseTags,
  hasChannel,
} from '@/types/course';

// Values shown beside a course, for the accreditation it is shown by.
export type CourseRowFacts = {
  readonly credits: number | undefined;
  readonly semester: number | undefined;
  readonly students: number;
};

type CourseTableRowProps = {
  accreditation: Accreditation | null;
  course: CourseRaw;
  facts: CourseRowFacts;
  onClick: () => void;
};

export const CourseTableRow = (props: CourseTableRowProps) => {
  const { language, t } = useLanguage();
  const numberCell = 'hidden whitespace-nowrap tabular-nums';
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
      <TableCell class="font-medium">
        {getCourseName(props.course, props.accreditation, language())}
      </TableCell>
      <TableCell class="hidden whitespace-nowrap md:table-cell">
        {getAccLabel(props.course)}
      </TableCell>
      <TableCell class={`${numberCell} md:table-cell`}>
        {props.facts.semester ?? ''}
      </TableCell>
      <TableCell class={`${numberCell} lg:table-cell`}>
        {props.facts.credits ?? ''}
      </TableCell>
      <TableCell class={`${numberCell} md:table-cell`}>
        {formatNumber(props.facts.students, language())}
      </TableCell>
      <TableCell class="hidden whitespace-nowrap text-center md:table-cell">
        <Show when={hasChannel(props.course)}>
          <Check class="text-primary mx-auto h-4 w-4" />
        </Show>
      </TableCell>
      <TableCell class="hidden lg:table-cell">
        <div class="flex flex-wrap gap-1">
          <For each={getCourseTags(props.course)}>
            {(tag) => (
              <Badge variant="secondary">{getTagLabel(tag, t())}</Badge>
            )}
          </For>
        </div>
      </TableCell>
    </TableRow>
  );
};
