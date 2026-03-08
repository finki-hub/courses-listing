import { For, Show } from 'solid-js';

import { InfoCircleIcon } from '@/components/ui/icons';
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from '@/components/ui/popover';

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
        class={`text-muted-foreground/50 hover:text-muted-foreground inline-flex cursor-help items-center transition-colors ${props.class ?? ''}`}
        type="button"
      >
        <InfoCircleIcon class="h-3.5 w-3.5" />
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
