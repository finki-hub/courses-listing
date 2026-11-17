import { Check } from 'lucide-solid';
import { Show } from 'solid-js';

type CheckboxProps = {
  checked: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
};

export const Checkbox = (props: CheckboxProps) => (
  <button
    aria-checked={props.checked}
    aria-label={props.label}
    class={`ring-offset-background focus-visible:ring-ring relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      props.checked
        ? 'bg-primary text-primary-foreground border-primary'
        : 'border-input bg-card'
    } ${
      props.disabled
        ? 'cursor-not-allowed border-dashed'
        : 'cursor-pointer hover:border-foreground'
    }`}
    disabled={props.disabled}
    onClick={() => {
      props.onToggle();
    }}
    role="checkbox"
    type="button"
  >
    <Show when={props.checked}>
      <Check class="absolute h-3.5 w-3.5" />
    </Show>
  </button>
);
