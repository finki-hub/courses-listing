import { Lock } from 'lucide-solid';
import { Show } from 'solid-js';

import { InfoTip } from '@/components/ui/info-tip';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { StatusBadge } from '@/components/ui/status-badge';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getProgramStateKind, type SimulatorCourse } from '@/lib/simulator';
import {
  COURSE_STATUS_VALUES,
  type CourseStatusValue,
} from '@/lib/simulator-view';
import { cn } from '@/lib/utils';

import { getStatusClass, PROGRAM_STATE_TONES } from './course-styles';

export type CourseStatusRowProps = {
  atLimit: boolean;
  course: SimulatorCourse;
  enabled: boolean;
  exclusiveBlocker?: string;
  onSetStatus: (status: CourseStatusValue) => void;
  overLimit: boolean;
  /** Every reason behind the course's state, one per line. */
  reason: string;
  status: CourseStatusValue;
};

// One course: its name and how the program offers it, and either its status
// as a three-way choice or, when it can't be taken yet, the short reason.
export const CourseStatusRow = (props: CourseStatusRowProps) => {
  const { t } = useLanguage();
  const kind = () => getProgramStateKind(props.course.programState);
  const locked = () => !props.enabled || props.exclusiveBlocker !== undefined;

  const lockedReason = () =>
    props.exclusiveBlocker === undefined
      ? t().simulator.locked.prerequisites
      : interpolate(t().simulator.locked.project, {
          course: props.exclusiveBlocker,
        });

  const statusItems = () =>
    COURSE_STATUS_VALUES.map((value) => ({
      label: t().simulator.status[value],
      value,
    }));

  return (
    <li
      class={cn(
        'grid gap-x-4 gap-y-2 border-l-[3px] px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4',
        getStatusClass({
          atLimit: props.atLimit,
          listened: props.status !== 'none',
          overLimit: props.overLimit,
          passed: props.status === 'passed',
        }),
      )}
    >
      <div class="min-w-0 space-y-1">
        <div
          class={cn(
            'text-sm font-medium leading-snug',
            locked() && 'text-muted-foreground',
          )}
        >
          {props.course.name}
        </div>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Show when={kind()}>
            {(k) => (
              <StatusBadge tone={PROGRAM_STATE_TONES[k()]}>
                {t().programState[k()]}
              </StatusBadge>
            )}
          </Show>
          <Show when={props.atLimit && !locked()}>
            <span class="text-warning text-xs">
              {interpolate(t().simulator.locked.limit, {
                level: props.course.level,
              })}
            </span>
          </Show>
          <Show when={props.course.prerequisite}>
            {(prerequisite) => (
              <span class="text-muted-foreground hidden min-w-0 truncate text-xs md:inline md:max-w-md">
                {t().common.prerequisite}: {prerequisite()}
              </span>
            )}
          </Show>
          <InfoTip text={props.reason} />
        </div>
      </div>

      <Show
        fallback={
          <p class="text-locked inline-flex items-center gap-1.5 text-xs font-medium sm:justify-end">
            <Lock
              aria-hidden="true"
              class="h-3.5 w-3.5 shrink-0"
            />
            {lockedReason()}
          </p>
        }
        when={!locked()}
      >
        <SegmentedControl
          aria-label={interpolate(t().simulator.status.label, {
            course: props.course.name,
          })}
          class="w-full sm:w-auto"
          items={statusItems()}
          onSelect={props.onSetStatus}
          size="sm"
          value={props.status}
        />
      </Show>
    </li>
  );
};
