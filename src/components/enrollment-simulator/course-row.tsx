import { Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getProgramStateKind,
  PROGRAM_STATE_LABELS,
  PROGRAM_STATE_SHORT_LABELS,
  type SimulatorCourse,
} from '@/lib/simulator';

import { getStatusClass, PROGRAM_STATE_BADGE_CLASSES } from './course-styles';
import { InfoPopover } from './info-popover';
import { Checkbox } from './simulator-checkbox';

/** Minimum row height to prevent layout shift when badges wrap */
const ROW_HEIGHT = '41px';

type CourseRowProps = {
  atLimit: boolean;
  course: SimulatorCourse;
  enabled: boolean;
  exclusiveBlocker?: string;
  listened: boolean;
  onToggleListened: () => void;
  onTogglePassed: () => void;
  overLimit: boolean;
  passed: boolean;
  reason: string;
};

export const CourseRow = (props: CourseRowProps) => (
  <TableRow
    class={`box-border border-l-[3px] ${props.enabled ? '' : 'opacity-40'} ${getStatusClass({ atLimit: props.atLimit, listened: props.listened, overLimit: props.overLimit, passed: props.passed })}`}
    style={{ height: ROW_HEIGHT }}
  >
    <TableCell class="text-muted-foreground whitespace-nowrap text-center text-xs">
      {props.course.semester}
    </TableCell>
    <TableCell class="font-medium">
      <span class="inline-flex items-center gap-1 leading-none">
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
                    <span class="sm:hidden">
                      {PROGRAM_STATE_SHORT_LABELS[k()]}
                    </span>
                    <span class="hidden sm:inline">
                      {PROGRAM_STATE_LABELS[k()]}
                    </span>
                  </Badge>
                )}
              </Show>
            );
          }}
        </Show>
        <InfoPopover text={props.reason} />
      </span>
    </TableCell>
    <TableCell class="text-center">
      <Checkbox
        checked={props.listened}
        disabled={!props.enabled || props.exclusiveBlocker !== undefined}
        onToggle={() => {
          props.onToggleListened();
        }}
      />
    </TableCell>
    <TableCell class="text-center">
      <Checkbox
        checked={props.passed}
        disabled={!props.enabled || props.exclusiveBlocker !== undefined}
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
        {(prereq) => (
          <span class="inline-flex items-center gap-1">
            <span class="truncate">{prereq()}</span>
          </span>
        )}
      </Show>
    </TableCell>
  </TableRow>
);
