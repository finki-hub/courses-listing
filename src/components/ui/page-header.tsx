import { type JSX } from '@solidjs/web';
import { Show } from 'solid-js';

import { cn } from '@/lib/utils';

type PageHeaderProps = {
  /** Controls that act on the whole page, aligned to the end. */
  actions?: JSX.Element;
  class?: string;
  description?: string;
  title: string;
};

// The title of a tab and one line on what it is for.
export const PageHeader = (props: PageHeaderProps) => (
  <div
    class={cn(
      'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
      props.class,
    )}
  >
    <div class="min-w-0 space-y-1">
      <h2 class="text-page font-semibold">{props.title}</h2>
      <Show when={props.description}>
        <p class="text-muted-foreground max-w-prose text-sm">
          {props.description}
        </p>
      </Show>
    </div>
    <Show when={props.actions}>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        {props.actions}
      </div>
    </Show>
  </div>
);

type SectionHeaderProps = {
  actions?: JSX.Element;
  class?: string;
  /** Heading level; sections inside a page default to h3. */
  level?: 3 | 4;
  meta?: JSX.Element;
  title: string;
};

// The heading of a group of content within a page or panel.
export const SectionHeader = (props: SectionHeaderProps) => (
  <div
    class={cn(
      'flex flex-wrap items-center justify-between gap-x-3 gap-y-1',
      props.class,
    )}
  >
    <div class="flex min-w-0 flex-wrap items-baseline gap-x-2">
      {props.level === 4 ? (
        <h4 class="text-sm font-semibold">{props.title}</h4>
      ) : (
        <h3 class="text-section font-semibold">{props.title}</h3>
      )}
      <Show when={props.meta}>
        <span class="text-muted-foreground text-meta">{props.meta}</span>
      </Show>
    </div>
    <Show when={props.actions}>
      <div class="flex items-center gap-2">{props.actions}</div>
    </Show>
  </div>
);
