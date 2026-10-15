import { Select } from '@kobalte/core/select';
import { Check, ChevronDown, Globe } from 'lucide-solid';
import { createUniqueId } from 'solid-js';

import { isLanguage, type Language, languageNames } from '@/lib/i18n';

type LanguageSelectProps = {
  readonly label: string;
  readonly language: Language;
  readonly setLanguage: (language: Language) => void;
};

export const LanguageSelect = (props: LanguageSelectProps) => {
  const id = createUniqueId();
  const languages = Object.keys(languageNames).filter(isLanguage);
  let triggerRef: HTMLButtonElement | undefined;
  let usedPointer = false;
  const markPointer = () => {
    usedPointer = true;
  };
  const markKeyboard = () => {
    usedPointer = false;
  };

  return (
    <Select<Language>
      disallowEmptySelection
      gutter={6}
      id={id}
      itemComponent={(itemProps) => (
        <Select.Item
          class="group relative flex min-h-10 w-full cursor-default select-none items-center gap-3 rounded-lg py-1.5 pl-2 pr-8 text-sm outline-none data-highlighted:bg-muted data-highlighted:text-foreground"
          item={itemProps.item}
        >
          <Select.ItemIndicator class="absolute right-2 flex size-3.5 items-center justify-center text-primary">
            <Check class="size-4" />
          </Select.ItemIndicator>
          <Select.ItemLabel class="flex items-center gap-3">
            <span
              aria-hidden="true"
              class="inline-flex h-6 w-8 items-center justify-center rounded-md border border-border bg-muted/60 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground transition-colors group-data-selected:border-primary/30 group-data-selected:bg-primary/10 group-data-selected:text-primary"
            >
              {itemProps.item.rawValue.toUpperCase()}
            </span>
            <span
              class="group-data-selected:font-medium"
              lang={itemProps.item.rawValue}
            >
              {languageNames[itemProps.item.rawValue]}
            </span>
          </Select.ItemLabel>
        </Select.Item>
      )}
      onChange={(value) => {
        if (isLanguage(value)) props.setLanguage(value);
      }}
      options={languages}
      optionTextValue={(language) => languageNames[language]}
      placement="bottom-end"
      value={props.language}
    >
      <Select.Label class="sr-only">{props.label}</Select.Label>
      <Select.Trigger
        class="flex h-10 w-auto items-center justify-between gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm font-medium shadow-sm ring-offset-background backdrop-blur-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-expanded:bg-muted [&>svg:last-child]:transition-transform [&[data-expanded]>svg:last-child]:rotate-180"
        onKeyDown={markKeyboard}
        onPointerDown={markPointer}
        ref={(element) => {
          triggerRef = element;
        }}
      >
        <Globe
          aria-hidden="true"
          class="size-4"
        />
        <Select.Value<Language>>
          {() => (
            <span title={languageNames[props.language]}>
              {props.language.toUpperCase()}
            </span>
          )}
        </Select.Value>
        <Select.Icon class="[&>svg]:transition-transform data-expanded:[&>svg]:rotate-180">
          <ChevronDown
            aria-hidden="true"
            class="size-4 opacity-50"
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          class="relative z-50 min-w-52 overflow-hidden rounded-xl border border-border/60 bg-popover/95 text-popover-foreground shadow-lg backdrop-blur-md origin-(--kb-select-content-transform-origin) data-expanded:animate-in data-expanded:fade-in-0 data-expanded:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          onCloseAutoFocus={(event) => {
            if (!usedPointer) return;
            event.preventDefault();
            triggerRef?.focus({ focusVisible: false, preventScroll: true });
          }}
          onKeyDown={markKeyboard}
          onPointerDown={markPointer}
          onPointerDownOutside={markPointer}
        >
          <div
            aria-hidden="true"
            class="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground"
          >
            {props.label}
          </div>
          <Select.Listbox class="max-h-(--kb-popper-content-available-height) overflow-y-auto p-1 outline-none" />
        </Select.Content>
      </Select.Portal>
    </Select>
  );
};
