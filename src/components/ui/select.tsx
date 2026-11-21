import { type ComponentProps } from '@solidjs/web';
import { createEffect, For, omit, Show } from 'solid-js';

import { FIELD_CLASS } from '@/components/ui/field';
import { ChevronDown } from '@/components/ui/icons';
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
  const rest = omit(
    props,
    'class',
    'emptyLabel',
    'onChange',
    'options',
    'value',
  );
  const current = () => props.value ?? '';
  const isUnknown = () =>
    current() !== '' &&
    props.options.every((option) => option.value !== current());

  let select: HTMLSelectElement | undefined;
  // Rebuilt options can reset the native selection, so reapply the value
  // after every change to it or to the options.
  createEffect(
    () => [current(), props.options, isUnknown()] as const,
    ([value]) => {
      if (select) select.value = value;
    },
  );

  return (
    <div class={cn('relative w-full', props.class)}>
      <select
        class={cn(FIELD_CLASS, 'cursor-pointer appearance-none pr-9')}
        onChange={(event) => {
          props.onChange(event.currentTarget.value);
        }}
        ref={(element) => {
          select = element;
        }}
        value={current()}
        {...rest}
      >
        <Show when={props.emptyLabel !== undefined || current() === ''}>
          <option
            disabled={props.emptyLabel === undefined}
            hidden={props.emptyLabel === undefined}
            value=""
          >
            {props.emptyLabel ?? ''}
          </option>
        </Show>
        <Show when={isUnknown()}>
          <option value={current()}>{current()}</option>
        </Show>
        <For each={props.options}>
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
