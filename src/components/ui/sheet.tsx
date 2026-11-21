import { Dialog as DialogPrimitive } from '@kobalte/core/dialog';
import { type JSX } from '@solidjs/web';
import { createEffect, Show } from 'solid-js';

import { X } from '@/components/ui/icons';
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

// Only the panel opened last answers Escape, as Kobalte's layer stack would.
const openSheets: symbol[] = [];
const NESTED_LAYER_SELECTOR =
  '[role="dialog"]:not([data-sheet-content]), [role="listbox"], [role="menu"]';

// A panel over the page: a side panel on desktop and a bottom sheet on
// mobile, with a title, a close button, a scrolling body and a footer.
export const Sheet = (props: SheetProps) => {
  const { t } = useLanguage();
  // The panel opens from code rather than a trigger, so it remembers what had
  // focus and returns it there on close instead of leaving it on the page.
  let opener: HTMLElement | undefined;

  // Kobalte 2 alpha registers its dismissable layer before the content ref is
  // set, so its Escape and outside-click handling never run. Handle Escape
  // here until that is fixed upstream; a handled event is left alone.
  const sheet = Symbol('sheet');
  const onEscape = (event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.key !== 'Escape' ||
      openSheets.at(-1) !== sheet ||
      // A nested popover, select or menu closes first; only the sheet closes
      // once nothing else is open above it.
      document.querySelector(NESTED_LAYER_SELECTOR)
    )
      return;
    props.onOpenChange(false);
  };
  createEffect(
    () => props.open,
    (open) => {
      if (open) {
        openSheets.push(sheet);
        addEventListener('keydown', onEscape);
      }
      // eslint-disable-next-line unicorn/consistent-function-scoping -- closes over this panel's symbol
      return () => {
        const index = openSheets.indexOf(sheet);
        if (index !== -1) openSheets.splice(index, 1);
        removeEventListener('keydown', onEscape);
      };
    },
  );

  return (
    <DialogPrimitive
      onOpenChange={props.onOpenChange}
      open={props.open}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          class="bg-scrim data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 fixed inset-0 z-50"
          onClick={() => {
            props.onOpenChange(false);
          }}
        />
        <DialogPrimitive.Content
          class={cn(
            'bg-card text-card-foreground data-[expanded]:animate-in data-[closed]:animate-out fixed z-50 flex flex-col shadow-xl duration-200 motion-reduce:duration-0',
            'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl border-t data-[expanded]:slide-in-from-bottom data-[closed]:slide-out-to-bottom',
            'sm:inset-x-auto sm:top-0 sm:bottom-0 sm:h-dvh sm:max-h-none sm:w-[min(28rem,92vw)] sm:rounded-none sm:border-t-0',
            PANEL_SIDES[props.side ?? 'right'],
            props.class,
          )}
          data-sheet-content
          onCloseAutoFocus={(event) => {
            if (!opener?.isConnected) return;
            event.preventDefault();
            opener.focus({ preventScroll: true });
          }}
          onOpenAutoFocus={() => {
            opener =
              document.activeElement instanceof HTMLElement &&
              document.activeElement !== document.body
                ? document.activeElement
                : undefined;
          }}
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
              // Set the property rather than the JSX attribute: Solid 2 types
              // spell it `tabindex`, while the a11y rule only accepts an
              // interactive element carrying `tabIndex`.
              element.tabIndex = 0;
              props.bodyRef?.(element);
            }}
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
