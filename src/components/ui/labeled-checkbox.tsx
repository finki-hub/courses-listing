import { type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

type LabeledCheckboxProps = {
  checked: boolean;
  children: JSX.Element;
  class?: string;
  onChange: () => void;
};

export const LabeledCheckbox = (props: LabeledCheckboxProps) => (
  <label
    class={cn('flex cursor-pointer items-center gap-2 text-sm', props.class)}
  >
    <input
      checked={props.checked}
      class="accent-primary h-4 w-4"
      onChange={() => {
        props.onChange();
      }}
      type="checkbox"
    />
    {props.children}
  </label>
);
