import { Check } from 'lucide-solid';
import { type JSX, Show } from 'solid-js';

import { cn } from '@/lib/utils';

type ToggleChipProps = {
  children: JSX.Element;
  class?: string;
  onToggle: () => void;
  pressed: boolean;
};

// One option of a multi-select set (tags and the like): a pill that reads as
// a control at rest and shows a check when on.
export const ToggleChip = (props: ToggleChipProps) => (
  <button
    aria-pressed={props.pressed}
    class={cn(
      'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
      props.pressed
        ? 'border-primary bg-primary/10 text-foreground font-medium'
        : 'bg-card text-muted-foreground hover:border-input hover:text-foreground',
      props.class,
    )}
    onClick={() => {
      props.onToggle();
    }}
    type="button"
  >
    <Show when={props.pressed}>
      <Check
        aria-hidden="true"
        class="text-primary -ml-0.5 h-3.5 w-3.5"
      />
    </Show>
    {props.children}
  </button>
);
