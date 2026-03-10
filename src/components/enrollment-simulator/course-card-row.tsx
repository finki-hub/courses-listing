import { Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import {
  getProgramStateKind,
  PROGRAM_STATE_SHORT_LABELS,
} from '@/lib/simulator';

import { getStatusClass, PROGRAM_STATE_BADGE_CLASSES } from './course-styles';
import { InfoPopover } from './info-popover';
import { Checkbox } from './simulator-checkbox';

type CourseCardRowProps = {
  atLimit: boolean;
  course: {
    name: string;
    programState: string | undefined;
    semester: number;
  };
  enabled: boolean;
  exclusiveBlocker?: string;
  listened: boolean;
  onToggleListened: () => void;
  onTogglePassed: () => void;
  overLimit: boolean;
  passed: boolean;
  reason: string;
};

export const CourseCardRow = (props: CourseCardRowProps) => {
  const kind = () =>
    props.course.programState
      ? getProgramStateKind(props.course.programState)
      : undefined;

  return (
    <div
      class={`flex items-center gap-2 rounded-lg border border-l-[3px] px-2.5 py-2 ${
        props.enabled ? '' : 'opacity-40'
      } ${getStatusClass({
        atLimit: props.atLimit,
        listened: props.listened,
        overLimit: props.overLimit,
        passed: props.passed,
      })}`}
    >
      <span class="text-muted-foreground w-6 shrink-0 text-center text-xs">
        {props.course.semester}
      </span>

      <div class="min-w-0 flex-1">
        <div class="text-sm font-medium leading-snug">{props.course.name}</div>
        <div class="mt-0.5 flex items-center gap-1">
          <Show when={kind()}>
            {(k) => (
              <Badge
                class={`px-1.5 py-0 text-[10px] leading-4 font-normal ${PROGRAM_STATE_BADGE_CLASSES[k()]}`}
                variant="outline"
              >
                {PROGRAM_STATE_SHORT_LABELS[k()]}
              </Badge>
            )}
          </Show>
          <InfoPopover text={props.reason} />
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <div class="flex flex-col items-center gap-0.5">
          <Checkbox
            checked={props.listened}
            disabled={!props.enabled || props.exclusiveBlocker !== undefined}
            onToggle={() => {
              props.onToggleListened();
            }}
          />
          <span class="text-muted-foreground text-[9px] leading-none">С</span>
        </div>
        <div class="flex flex-col items-center gap-0.5">
          <Checkbox
            checked={props.passed}
            disabled={!props.enabled || props.exclusiveBlocker !== undefined}
            onToggle={() => {
              props.onTogglePassed();
            }}
          />
          <span class="text-muted-foreground text-[9px] leading-none">П</span>
        </div>
      </div>
    </div>
  );
};
