import { For } from 'solid-js';

type ButtonGroupItem<T extends string> = {
  label: string;
  value: T;
};

type ButtonGroupProps<T extends string> = {
  items: Array<ButtonGroupItem<T>> | ReadonlyArray<ButtonGroupItem<T>>;
  onSelect: (value: T) => void;
  value: T;
};

export const ButtonGroup = <T extends string>(props: ButtonGroupProps<T>) => (
  <div
    class="inline-flex rounded-md border"
    role="group"
  >
    <For each={[...props.items]}>
      {(item, i) => (
        <button
          class={`whitespace-nowrap px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm ${
            i() === 0 ? 'rounded-l-md' : ''
          } ${i() === props.items.length - 1 ? 'rounded-r-md' : ''} ${
            props.value === item.value
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
          onClick={() => {
            props.onSelect(item.value);
          }}
          type="button"
        >
          {item.label}
        </button>
      )}
    </For>
  </div>
);
