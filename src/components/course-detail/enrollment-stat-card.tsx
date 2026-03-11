import { Show } from 'solid-js';

type EnrollmentStatCardProps = {
  label: string;
  meta?: string;
  value: string;
};

export const EnrollmentStatCard = (props: EnrollmentStatCardProps) => (
  <div class="rounded-lg border bg-muted/20 p-3">
    <div class="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
      {props.label}
    </div>
    <div class="mt-1 text-xl font-semibold tabular-nums">{props.value}</div>
    <Show when={props.meta}>
      <div class="text-muted-foreground mt-1 text-xs">{props.meta}</div>
    </Show>
  </div>
);
