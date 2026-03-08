import { Popover as PopoverPrimitive } from '@kobalte/core/popover';
import { type ComponentProps, splitProps, type ValidComponent } from 'solid-js';

import { cn } from '@/lib/utils';

export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverPortal = PopoverPrimitive.Portal;

type PopoverContentProps<T extends ValidComponent = 'div'> = ComponentProps<
  typeof PopoverPrimitive.Content<T>
>;

export const PopoverContent = <T extends ValidComponent = 'div'>(
  props: PopoverContentProps<T>,
) => {
  const [local, rest] = splitProps(props as PopoverContentProps, ['class']);

  return (
    <PopoverPrimitive.Content
      class={cn(
        'bg-background text-foreground data-expanded:animate-in data-closed:animate-out data-closed:fade-out-0 data-expanded:fade-in-0 data-closed:zoom-out-95 data-expanded:zoom-in-95 z-50 max-w-[min(calc(100vw-1rem),20rem)] rounded-lg border p-3 text-sm shadow-md outline-none',
        local.class,
      )}
      {...rest}
    />
  );
};

export { Popover } from '@kobalte/core/popover';
