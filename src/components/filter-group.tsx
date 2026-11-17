import { createUniqueId, type JSX, Show } from 'solid-js';

import { InfoPopover } from '@/components/enrollment-simulator/info-popover';

type FilterGroupProps = {
  children: JSX.Element;
  /** Optional explanation behind an info button next to the controls. */
  info?: string;
  label: string;
};

// A labelled row of filter controls. The label sits beside the controls at
// every width, so it adds no height on narrow screens.
export const FilterGroup = (props: FilterGroupProps) => {
  const labelId = createUniqueId();
  return (
    <div
      aria-labelledby={labelId}
      class="flex items-center gap-2"
      role="group"
    >
      <span
        class="text-muted-foreground w-22 shrink-0 text-xs sm:w-auto sm:text-sm"
        id={labelId}
      >
        {props.label}
      </span>
      <div class="min-w-0 flex-1 sm:flex-none">{props.children}</div>
      <Show when={props.info}>{(info) => <InfoPopover text={info()} />}</Show>
    </div>
  );
};
