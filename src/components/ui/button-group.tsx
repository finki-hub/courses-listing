import { createMemo, For } from 'solid-js';

type ButtonGroupItem<T extends string> = {
  label: string;
  value: T;
};

type ButtonGroupProps<T extends string> = {
  class?: string;
  items: Array<ButtonGroupItem<T>> | ReadonlyArray<ButtonGroupItem<T>>;
  onSelect: (value: T) => void;
  value: T;
};

export const ButtonGroup = <T extends string>(props: ButtonGroupProps<T>) => {
  const items = createMemo(() => [...props.items]);
  const mobileColumns = createMemo(() =>
    Math.min(Math.max(items().length, 1), 4),
  );

  return (
    <div
      class={`grid gap-1 sm:inline-flex sm:gap-0 sm:overflow-hidden sm:rounded-md sm:border ${props.class ?? ''}`}
      role="group"
      style={{
        'grid-template-columns': `repeat(${String(mobileColumns())}, minmax(0, 1fr))`,
      }}
    >
      <For each={items()}>
        {(item, i) => (
          <button
            class={`min-h-9 rounded-md border px-2 py-2 text-center text-xs font-medium transition-colors sm:min-h-0 sm:rounded-none sm:border-0 sm:px-3 sm:py-2 sm:text-sm ${
              i() === items().length - 1 ? '' : 'sm:border-r'
            } ${
              props.value === item.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
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
};
