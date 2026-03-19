import { Check } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  type CourseRaw,
  getAccLabel,
  getCourseTags,
  getTagLabel,
  hasChannel,
} from '@/types/course';

type CourseTableRowProps = {
  course: CourseRaw;
  onClick: () => void;
};

export const CourseTableRow = (props: CourseTableRowProps) => (
  <TableRow
    class="cursor-pointer"
    onClick={props.onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        props.onClick();
      }
    }}
    role="button"
    tabIndex={0}
  >
    <TableCell class="font-medium">{props.course.name}</TableCell>
    <TableCell class="hidden whitespace-nowrap md:table-cell">
      {getAccLabel(props.course)}
    </TableCell>
    <TableCell class="hidden whitespace-nowrap text-center md:table-cell">
      <Show when={hasChannel(props.course)}>
        <Check class="text-primary mx-auto h-4 w-4" />
      </Show>
    </TableCell>
    <TableCell class="hidden lg:table-cell">
      <div class="flex flex-wrap gap-1">
        <For each={getCourseTags(props.course)}>
          {(tag) => <Badge variant="secondary">{getTagLabel(tag)}</Badge>}
        </For>
      </div>
    </TableCell>
  </TableRow>
);
