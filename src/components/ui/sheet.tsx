import { Dialog as DialogPrimitive } from '@kobalte/core/dialog';
import { X } from 'lucide-solid';
import { type JSX, Show } from 'solid-js';

import { useLanguage } from '@/lib/LanguageProvider';
import { cn } from '@/lib/utils';

type SheetProps = {
  /** The scrolling body, for callers that reset its scroll position. */
  bodyRef?: (element: HTMLDivElement) => void;
  children: JSX.Element;
  class?: string;
  description?: string;
  /** Sticky actions under the scrolling body, such as Apply or Clear. */
  footer?: JSX.Element;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** Desktop side; mobile always slides up from the bottom. */
  side?: 'left' | 'right';
  title: string;
};

const PANEL_SIDES = {
  left: 'sm:left-0 sm:border-r data-[expanded]:sm:slide-in-from-left data-[closed]:sm:slide-out-to-left',
  right:
    'sm:right-0 sm:border-l data-[expanded]:sm:slide-in-from-right data-[closed]:sm:slide-out-to-right',
} as const;

// A panel over the page: a side panel on desktop and a bottom sheet on
// mobile, with a title, a close button, a scrolling body and a footer.
export const Sheet = (props: SheetProps) => {
  const { t } = useLanguage();
  return (
    <DialogPrimitive
      onOpenChange={props.onOpenChange}
      open={props.open}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay class="bg-scrim data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 fixed inset-0 z-50" />
        <DialogPrimitive.Content
          class={cn(
            'bg-card text-card-foreground data-[expanded]:animate-in data-[closed]:animate-out fixed z-50 flex flex-col shadow-xl duration-200 motion-reduce:duration-0',
            'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl border-t data-[expanded]:slide-in-from-bottom data-[closed]:slide-out-to-bottom',
            'sm:inset-x-auto sm:top-0 sm:bottom-0 sm:h-dvh sm:max-h-none sm:w-[min(28rem,92vw)] sm:rounded-none sm:border-t-0',
            PANEL_SIDES[props.side ?? 'right'],
            props.class,
          )}
        >
          <div
            aria-hidden="true"
            class="bg-border mx-auto mt-2 h-1 w-10 rounded-full sm:hidden"
          />
          <div class="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5 sm:py-4">
            <div class="min-w-0 space-y-0.5">
              <DialogPrimitive.Title class="text-section font-semibold">
                {props.title}
              </DialogPrimitive.Title>
              <Show when={props.description}>
                <DialogPrimitive.Description class="text-muted-foreground text-sm">
                  {props.description}
                </DialogPrimitive.Description>
              </Show>
            </div>
            <DialogPrimitive.CloseButton
              aria-label={t().common.close}
              class="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring -mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <X
                aria-hidden="true"
                class="h-4 w-4"
              />
            </DialogPrimitive.CloseButton>
          </div>
          {/* Focusable so keyboards can scroll a body with no controls. */}
          <div
            class="focus-visible:ring-ring min-h-0 flex-1 overflow-y-auto px-4 py-4 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset sm:px-5"
            ref={(element) => {
              props.bodyRef?.(element);
            }}
            tabIndex={0}
          >
            {props.children}
          </div>
          <Show when={props.footer}>
            <div class="flex items-center justify-end gap-2 border-t px-4 py-3 sm:px-5">
              {props.footer}
            </div>
          </Show>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive>
  );
};
