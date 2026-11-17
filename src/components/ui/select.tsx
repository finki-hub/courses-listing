import { ChevronDown } from 'lucide-solid';
import { type ComponentProps, For, splitProps } from 'solid-js';

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
// and keyboard behavior, the chevron makes it read as a dropdown.
export const Select = (props: SelectProps) => {
  const [local, rest] = splitProps(props, [
    'class',
    'emptyLabel',
    'onChange',
    'options',
    'value',
  ]);
  return (
    <div class={cn('relative w-full', local.class)}>
      <select
        class={cn(FIELD_CLASS, 'cursor-pointer appearance-none pr-9')}
        onChange={(event) => {
          local.onChange(event.currentTarget.value);
        }}
        {...rest}
      >
        {local.emptyLabel === undefined ? null : (
          <option
            selected={local.value === null || local.value === ''}
            value=""
          >
            {local.emptyLabel}
          </option>
        )}
        <For each={local.options}>
          {(option) => (
            <option
              selected={local.value === option.value}
              value={option.value}
            >
              {option.label}
            </option>
          )}
        </For>
      </select>
      <ChevronDown
        aria-hidden="true"
        class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
      />
    </div>
  );
};
