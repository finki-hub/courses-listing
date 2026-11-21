import { For, Show } from 'solid-js';

import { Info } from '@/components/ui/icons';
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/lib/LanguageProvider';
import { cn } from '@/lib/utils';

type InfoTipProps = {
  /** Additional CSS classes for the trigger button */
  class?: string;
  /** Preferred placement (default: "bottom") */
  placement?: 'bottom' | 'bottom-end' | 'bottom-start' | 'top';
  /** Multi-line text (newline-separated) to display */
  text: string;
};

export const InfoTip = (props: InfoTipProps) => {
  const { t } = useLanguage();
  return (
    <Show when={props.text}>
      <Popover placement={props.placement ?? 'bottom'}>
        <PopoverTrigger
          aria-label={t().common.moreInfo}
          as="button"
          class={cn(
            'text-muted-foreground hover:text-foreground hover:bg-muted data-[expanded]:text-foreground data-[expanded]:bg-muted ring-offset-background inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
            props.class,
          )}
          title={t().common.moreInfo}
          type="button"
        >
          <Info
            aria-hidden="true"
            class="h-4 w-4"
          />
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
};
