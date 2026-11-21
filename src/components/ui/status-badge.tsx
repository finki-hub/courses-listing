import { type JSX } from '@solidjs/web';
import { omit } from 'solid-js';

import { cn } from '@/lib/utils';

export type StatusTone =
  | 'danger'
  | 'elective'
  | 'enrolled'
  | 'faculty'
  | 'info'
  | 'locked'
  | 'neutral'
  | 'passed'
  | 'required'
  | 'warning';

/** Text, soft background and border classes per status tone. */
export const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  danger: 'text-danger bg-danger-soft border-danger-border',
  elective: 'text-elective bg-elective-soft border-elective-border',
  enrolled: 'text-enrolled bg-enrolled-soft border-enrolled-border',
  faculty: 'text-faculty bg-faculty-soft border-faculty-border',
  info: 'text-info bg-info-soft border-info-border',
  locked: 'text-locked bg-locked-soft border-locked-border',
  neutral: 'text-muted-foreground bg-muted border-border',
  passed: 'text-passed bg-passed-soft border-passed-border',
  required: 'text-required bg-required-soft border-required-border',
  warning: 'text-warning bg-warning-soft border-warning-border',
};

type StatusBadgeProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  size?: 'md' | 'sm';
  tone: StatusTone;
};

// A short status label (required, elective, passed...) in its semantic color.
export const StatusBadge = (props: StatusBadgeProps) => {
  const rest = omit(props, 'class', 'size', 'tone');
  return (
    <span
      class={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border font-medium whitespace-nowrap',
        props.size === 'md'
          ? 'px-2.5 py-0.5 text-xs'
          : 'px-2 py-px text-[11px] leading-4',
        STATUS_TONE_CLASSES[props.tone],
        props.class,
      )}
      {...rest}
    />
  );
};
