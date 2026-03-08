import { Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { InfoCircleIcon } from '@/components/ui/icons';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getProgramStateKind,
  PROGRAM_STATE_LABELS,
  type ProgramStateKind,
  type SimulatorCourse,
} from '@/lib/simulator';

import { Checkbox } from './simulator-checkbox';

const REQUIRED_BADGE_CLASS =
  'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25';

const PROGRAM_STATE_BADGE_CLASSES: Record<ProgramStateKind, string> = {
  elective:
    'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  'faculty-list':
    'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25',
  required: REQUIRED_BADGE_CLASS,
  'required-4yr': REQUIRED_BADGE_CLASS,
};

type CourseRowProps = {
  atLimit: boolean;
  course: SimulatorCourse;
  enabled: boolean;
  listened: boolean;
  onToggleListened: () => void;
  onTogglePassed: () => void;
  overLimit: boolean;
  passed: boolean;
  reason: string;
};

export const CourseRow = (props: CourseRowProps) => (
  <TableRow
    class={`box-border border-l-[3px] ${props.enabled ? '' : 'opacity-40'} ${
      props.overLimit
        ? 'bg-red-500/10 border-l-red-500'
        : props.passed
          ? 'bg-green-500/10 border-l-green-500'
          : props.listened
            ? 'bg-blue-500/10 border-l-blue-500'
            : props.atLimit
              ? 'bg-orange-500/10 border-l-orange-400'
              : 'border-l-transparent'
    }`}
    style={{ height: '41px' }}
  >
    <TableCell class="text-muted-foreground text-center text-xs">
      {props.course.semester}
    </TableCell>
    <TableCell class="font-medium">
      <span
        class="group/tip inline-flex cursor-help items-center gap-1 leading-none"
        title={props.reason}
      >
        {props.course.name}
        <Show when={props.course.programState}>
          {(state) => {
            const kind = () => getProgramStateKind(state());
            return (
              <Show when={kind()}>
                {(k) => (
                  <Badge
                    class={`ml-1 px-1.5 py-0 text-[10px] leading-4 font-normal ${PROGRAM_STATE_BADGE_CLASSES[k()]}`}
                    variant="outline"
                  >
                    {PROGRAM_STATE_LABELS[k()]}
                  </Badge>
                )}
              </Show>
            );
          }}
        </Show>
        <InfoCircleIcon class="text-muted-foreground/50 group-hover/tip:text-muted-foreground h-3.5 w-3.5 shrink-0 translate-y-px transition-colors" />
      </span>
    </TableCell>
    <TableCell class="text-center">
      <Checkbox
        checked={props.listened}
        disabled={!props.enabled}
        onToggle={() => {
          props.onToggleListened();
        }}
      />
    </TableCell>
    <TableCell class="text-center">
      <Checkbox
        checked={props.passed}
        disabled={!props.enabled}
        onToggle={() => {
          props.onTogglePassed();
        }}
      />
    </TableCell>
    <TableCell class="text-muted-foreground hidden max-w-50 truncate text-sm md:table-cell">
      <Show
        fallback="–"
        when={props.course.prerequisite}
      >
        <span title={props.course.prerequisite}>
          {props.course.prerequisite}
        </span>
      </Show>
    </TableCell>
  </TableRow>
);
