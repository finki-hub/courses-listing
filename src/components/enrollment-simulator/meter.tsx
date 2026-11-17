import { For } from 'solid-js';

import { cn } from '@/lib/utils';

export type MeterMarker = {
  /** Position on the bar, 0 to 100. */
  at: number;
  label: string;
};

type MeterProps = {
  class?: string;
  label: string;
  /** Points to read the fill against, such as a degree's credit total. */
  markers?: MeterMarker[];
  max: number;
  /** Danger once the value passes the maximum, as for a level limit. */
  overflow?: boolean;
  size?: 'md' | 'sm';
  value: number;
};

// A horizontal bar for credits against a target. The fill is the only
// colored part, so the number it stands for stays the thing to read.
export const Meter = (props: MeterProps) => {
  const percent = () =>
    props.max <= 0
      ? 0
      : Math.min(100, Math.max(0, (props.value / props.max) * 100));
  const over = () => props.overflow === true && props.value > props.max;

  return (
    <div
      aria-label={props.label}
      aria-valuemax={props.max}
      aria-valuemin={0}
      aria-valuenow={Math.min(props.value, props.max)}
      class={cn(
        'bg-muted relative w-full overflow-visible rounded-full',
        props.size === 'sm' ? 'h-1.5' : 'h-2.5',
        props.class,
      )}
      role="meter"
    >
      <div
        class={cn(
          'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
          over() ? 'bg-danger' : 'bg-primary',
        )}
        style={{ width: `${String(percent())}%` }}
      />
      <For each={props.markers}>
        {(marker) => (
          <span
            aria-hidden="true"
            class="bg-foreground/60 absolute -top-1 -bottom-1 w-0.5 rounded-full"
            style={{ left: `calc(${String(marker.at)}% - 1px)` }}
            title={marker.label}
          />
        )}
      </For>
    </div>
  );
};
