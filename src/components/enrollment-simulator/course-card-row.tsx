import { Lock } from 'lucide-solid';
import { Show } from 'solid-js';

import { InfoTip } from '@/components/ui/info-tip';
import { StatusBadge } from '@/components/ui/status-badge';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getProgramStateKind } from '@/lib/simulator';

import { getStatusClass, PROGRAM_STATE_TONES } from './course-styles';
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
  const { t } = useLanguage();
  const statusLabel = (status: string) =>
    interpolate(t().simulator.statusToggle, {
      course: props.course.name,
      status,
    });

  const kind = () =>
    props.course.programState
      ? getProgramStateKind(props.course.programState)
      : undefined;

  return (
    <div
      class={`flex items-center gap-2 rounded-lg border border-l-[3px] px-2.5 py-2 ${getStatusClass(
        {
          atLimit: props.atLimit,
          listened: props.listened,
          overLimit: props.overLimit,
          passed: props.passed,
        },
      )}`}
    >
      <span class="text-muted-foreground w-6 shrink-0 text-center text-xs">
        {props.course.semester}
      </span>

      <div class="min-w-0 flex-1">
        <div
          class={`flex items-center gap-1 text-sm font-medium leading-snug ${props.enabled ? '' : 'text-muted-foreground'}`}
        >
          <Show when={!props.enabled}>
            <Lock
              aria-hidden="true"
              class="h-3.5 w-3.5 shrink-0"
            />
          </Show>
          {props.course.name}
        </div>
        <div class="mt-0.5 flex items-center gap-1">
          <Show when={kind()}>
            {(k) => (
              <StatusBadge tone={PROGRAM_STATE_TONES[k()]}>
                {t().programStateShort[k()]}
              </StatusBadge>
            )}
          </Show>
          <InfoTip text={props.reason} />
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <div class="flex flex-col items-center gap-0.5">
          <Checkbox
            checked={props.listened}
            disabled={!props.enabled || props.exclusiveBlocker !== undefined}
            label={statusLabel(t().simulator.attended)}
            onToggle={() => {
              props.onToggleListened();
            }}
          />
          <span class="text-muted-foreground text-[9px] leading-none">
            {t().simulator.attendedShort}
          </span>
        </div>
        <div class="flex flex-col items-center gap-0.5">
          <Checkbox
            checked={props.passed}
            disabled={!props.enabled || props.exclusiveBlocker !== undefined}
            label={statusLabel(t().simulator.passed)}
            onToggle={() => {
              props.onTogglePassed();
            }}
          />
          <span class="text-muted-foreground text-[9px] leading-none">
            {t().simulator.passedShort}
          </span>
        </div>
      </div>
    </div>
  );
};
