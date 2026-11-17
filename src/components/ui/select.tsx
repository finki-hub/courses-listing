import { ChevronDown } from 'lucide-solid';
import {
  type ComponentProps,
  createEffect,
  For,
  on,
  Show,
  splitProps,
} from 'solid-js';

import { FIELD_CLASS } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export type SelectOption = { label: string; value: string };

type SelectProps = Omit<ComponentProps<'select'>, 'onChange' | 'value'> & {
  /** First option, standing for "no value" (an empty string). */
  emptyLabel?: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  value: null | string;
};

// A native select styled like the other fields: native keeps mobile pickers
// and keyboard behavior, the chevron makes it read as a dropdown. The select
// always shows the state: an empty value shows the empty option, and a value
// missing from the options gets an option of its own instead of silently
// showing the first one.
export const Select = (props: SelectProps) => {
  const [local, rest] = splitProps(props, [
    'class',
    'emptyLabel',
    'onChange',
    'options',
    'value',
  ]);
  const current = () => local.value ?? '';
  const isUnknown = () =>
    current() !== '' &&
    local.options.every((option) => option.value !== current());

  let select: HTMLSelectElement | undefined;
  // Rebuilt options can reset the native selection, so reapply the value
  // after every change to it or to the options.
  createEffect(
    on([current, () => local.options, isUnknown], ([value]) => {
      if (select) select.value = value;
    }),
  );

  return (
    <div class={cn('relative w-full', local.class)}>
      <select
        class={cn(FIELD_CLASS, 'cursor-pointer appearance-none pr-9')}
        onChange={(event) => {
          local.onChange(event.currentTarget.value);
        }}
        ref={(element) => {
          select = element;
        }}
        value={current()}
        {...rest}
      >
        <Show when={local.emptyLabel !== undefined || current() === ''}>
          <option
            disabled={local.emptyLabel === undefined}
            hidden={local.emptyLabel === undefined}
            value=""
          >
            {local.emptyLabel ?? ''}
          </option>
        </Show>
        <Show when={isUnknown()}>
          <option value={current()}>{current()}</option>
        </Show>
        <For each={local.options}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>
      <ChevronDown
        aria-hidden="true"
        class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
      />
    </div>
  );
};
