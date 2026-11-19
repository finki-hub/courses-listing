import { type JSX, Show } from 'solid-js';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  /** A button or link that moves the person forward. */
  action?: JSX.Element;
  class?: string;
  icon?: JSX.Element;
  text?: string;
  title: string;
};

// What to do next when there is nothing to show yet.
export const EmptyState = (props: EmptyStateProps) => (
  <div
    class={cn(
      'bg-card flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center',
      props.class,
    )}
  >
    <Show when={props.icon}>
      <div
        aria-hidden="true"
        class="bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full [&_svg]:h-5 [&_svg]:w-5"
      >
        {props.icon}
      </div>
    </Show>
    <div class="max-w-md space-y-1">
      <p class="text-section font-semibold">{props.title}</p>
      <Show when={props.text}>
        <p class="text-muted-foreground text-sm">{props.text}</p>
      </Show>
    </div>
    <Show when={props.action}>{props.action}</Show>
  </div>
);
