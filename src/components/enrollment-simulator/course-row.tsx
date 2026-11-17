import { Lock } from 'lucide-solid';
import { Show } from 'solid-js';

import { InfoTip } from '@/components/ui/info-tip';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getProgramStateKind, type SimulatorCourse } from '@/lib/simulator';

import { getStatusClass, PROGRAM_STATE_TONES } from './course-styles';
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

export const CourseRow = (props: CourseRowProps) => {
  const { t } = useLanguage();
  const statusLabel = (status: string) =>
    interpolate(t().simulator.statusToggle, {
      course: props.course.name,
      status,
    });
  return (
    <TableRow
      class={`box-border border-l-[3px] ${getStatusClass({ atLimit: props.atLimit, listened: props.listened, overLimit: props.overLimit, passed: props.passed })}`}
      style={{ height: ROW_HEIGHT }}
    >
      <TableCell class="text-muted-foreground whitespace-nowrap text-center text-xs">
        {props.course.semester}
      </TableCell>
      <TableCell
        class={`font-medium ${props.enabled ? '' : 'text-muted-foreground'}`}
      >
        <span class="inline-flex items-center gap-1 leading-none">
          <Show when={!props.enabled}>
            <Lock
              aria-hidden="true"
              class="h-3.5 w-3.5 shrink-0"
            />
          </Show>
          {props.course.name}
          <Show when={props.course.programState}>
            {(state) => {
              const kind = () => getProgramStateKind(state());
              return (
                <Show when={kind()}>
                  {(k) => (
                    <StatusBadge tone={PROGRAM_STATE_TONES[k()]}>
                      <span class="sm:hidden">
                        {t().programStateShort[k()]}
                      </span>
                      <span class="hidden sm:inline">
                        {t().programState[k()]}
                      </span>
                    </StatusBadge>
                  )}
                </Show>
              );
            }}
          </Show>
          <InfoTip text={props.reason} />
        </span>
      </TableCell>
      <TableCell class="text-center">
        <Checkbox
          checked={props.listened}
          disabled={!props.enabled || props.exclusiveBlocker !== undefined}
          label={statusLabel(t().simulator.attended)}
          onToggle={() => {
            props.onToggleListened();
          }}
        />
      </TableCell>
      <TableCell class="text-center">
        <Checkbox
          checked={props.passed}
          disabled={!props.enabled || props.exclusiveBlocker !== undefined}
          label={statusLabel(t().simulator.passed)}
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
};
