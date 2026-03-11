import { CircleAlert } from 'lucide-solid';
import { For, Show } from 'solid-js';

import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type InfoPopoverProps = {
  /** Additional CSS classes for the trigger button */
  class?: string;
  /** Preferred placement (default: "bottom") */
  placement?: 'bottom' | 'bottom-end' | 'bottom-start' | 'top';
  /** Multi-line text (newline-separated) to display */
  text: string;
};

export const InfoPopover = (props: InfoPopoverProps) => (
  <Show when={props.text}>
    <Popover placement={props.placement ?? 'bottom'}>
      <PopoverTrigger
        aria-label="Повеќе информации"
        as="button"
        class={cn(
          'ring-offset-background inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-sm transition-[transform,colors,box-shadow] hover:scale-105 hover:border-primary/45 hover:bg-primary/15 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
          props.class,
        )}
        title="Повеќе информации"
        type="button"
      >
        <CircleAlert class="h-4 w-4" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent>
          <div class="space-y-1">
            <For each={props.text.split('\n')}>
              {(line) => (
                <div class="whitespace-pre-wrap text-xs leading-relaxed">
                  {line}
                </div>
              )}
            </For>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  </Show>
);
