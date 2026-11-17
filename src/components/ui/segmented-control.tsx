import { createMemo, For, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export type SegmentedItem<T extends number | string> = {
  /** Spelled-out meaning of a short label, shown as a tooltip and read aloud. */
  description?: string;
  icon?: JSX.Element;
  label: string;
  value: T;
};

type SegmentedControlProps<T extends number | string> = {
  /**
   * Label of an explicit "all" option, shown first and selected while nothing
   * is. Choosing it calls `onClear`; choosing the selected item does too.
   */
  allLabel?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  class?: string;
  items: Array<SegmentedItem<T>> | ReadonlyArray<SegmentedItem<T>>;
  onClear?: () => void;
  onSelect: (value: T) => void;
  /** Smaller controls for dense toolbars. */
  size?: 'md' | 'sm';
  value?: null | T;
};

const OPTION_BASE =
  'inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-[color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-muted';

const OPTION_SIZES = {
  md: 'min-h-9 px-3 text-sm',
  sm: 'min-h-8 px-2.5 text-xs sm:text-sm',
} as const;

// A single choice among a few options, drawn as a track with the selected
// option raised. Arrow keys, Home and End move the selection, like a native
// radio group; only the selected option is in the tab order.
export const SegmentedControl = <T extends number | string>(
  props: SegmentedControlProps<T>,
) => {
  type Option = {
    description?: string;
    icon?: JSX.Element;
    key: string;
    label: string;
    value: null | T;
  };
  const options = createMemo<Option[]>(() => {
    const items = props.items.map((item) => ({
      ...item,
      key: String(item.value),
    }));
    return props.allLabel === undefined
      ? items
      : [{ key: '\0all', label: props.allLabel, value: null }, ...items];
  });

  const isSelected = (option: Option) =>
    option.value === null
      ? props.value === null || props.value === undefined
      : props.value === option.value;

  const choose = (option: Option) => {
    if (option.value === null || (props.onClear && isSelected(option))) {
      props.onClear?.();
      return;
    }
    props.onSelect(option.value);
  };

  const focusIndex = () => {
    const index = options().findIndex(isSelected);
    return index === -1 ? 0 : index;
  };

  let container: HTMLDivElement | undefined;

  const onKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, (index: number, count: number) => number> = {
      ArrowDown: (index, count) => (index + 1) % count,
      ArrowLeft: (index, count) => (index - 1 + count) % count,
      ArrowRight: (index, count) => (index + 1) % count,
      ArrowUp: (index, count) => (index - 1 + count) % count,
      End: (_index, count) => count - 1,
      Home: () => 0,
    };
    const move = keys[event.key];
    if (!move) return;
    event.preventDefault();
    const list = options();
    const next = list[move(focusIndex(), list.length)];
    if (!next) return;
    if (!isSelected(next)) choose(next);
    queueMicrotask(() => {
      container
        ?.querySelector<HTMLButtonElement>(
          `[data-key="${CSS.escape(next.key)}"]`,
        )
        ?.focus();
    });
  };

  return (
    <div
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      class={cn(
        // Phones get a grid of up to four columns, so long lists wrap into
        // even rows instead of squeezing; wider screens get one row.
        'bg-muted grid max-w-full grid-cols-[repeat(var(--segments),minmax(0,1fr))] gap-0.5 rounded-lg border p-0.5 sm:inline-flex sm:flex-wrap',
        props.class,
      )}
      onKeyDown={onKeyDown}
      ref={(element) => {
        container = element;
      }}
      role="radiogroup"
      style={{ '--segments': String(Math.min(options().length, 4)) }}
    >
      <For each={options()}>
        {(option, index) => (
          <button
            aria-checked={isSelected(option)}
            aria-label={
              option.description === undefined
                ? undefined
                : `${option.label}: ${option.description}`
            }
            class={cn(
              OPTION_BASE,
              OPTION_SIZES[props.size ?? 'md'],
              'sm:flex-none',
              isSelected(option)
                ? 'bg-raised text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-raised/60',
            )}
            data-key={option.key}
            onClick={() => {
              choose(option);
            }}
            role="radio"
            tabIndex={index() === focusIndex() ? 0 : -1}
            title={option.description}
            type="button"
          >
            {option.icon}
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
};
