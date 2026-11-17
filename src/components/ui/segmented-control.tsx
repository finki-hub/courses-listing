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
   * is. Choosing it calls `onClear`, the only way to clear the value.
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

const ALL_KEY = 'all:';
const MAX_MOBILE_COLUMNS = 4;

const OPTION_BASE =
  'inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-[color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-muted';

const OPTION_SIZES = {
  md: 'min-h-9 px-3 text-sm',
  sm: 'min-h-8 px-2.5 text-xs sm:text-sm',
} as const;

const keyOf = (value: null | number | string): string =>
  value === null ? ALL_KEY : `${typeof value}:${String(value)}`;

// The option in the row above or below `current` whose center is closest
// horizontally, so Up and Down follow the layout (grid or wrapped row).
const findVerticalNeighbor = (
  buttons: HTMLElement[],
  current: HTMLElement,
  direction: -1 | 1,
): HTMLElement | undefined => {
  const from = current.getBoundingClientRect();
  const center = from.left + from.width / 2;
  const rows = buttons
    .map((button) => ({ button, rect: button.getBoundingClientRect() }))
    .filter(({ rect }) =>
      direction === 1
        ? rect.top >= from.bottom - 1
        : rect.bottom <= from.top + 1,
    );
  if (rows.length === 0) return undefined;
  const rowTop =
    direction === 1
      ? Math.min(...rows.map(({ rect }) => rect.top))
      : Math.max(...rows.map(({ rect }) => rect.top));
  let closest: HTMLElement | undefined;
  let closestDistance = Infinity;
  for (const { button, rect } of rows) {
    const distance = Math.abs(rect.left + rect.width / 2 - center);
    if (!(Math.abs(rect.top - rowTop) < 2 && distance < closestDistance)) {
      continue;
    }

    closest = button;
    closestDistance = distance;
  }
  return closest;
};

// A single choice among a few options, drawn as a track with the selected
// option raised. It behaves like a native radio group: choosing the selected
// option changes nothing, Left and Right (wrapping), Home and End move the
// selection, Up and Down move between rows when it wraps and otherwise leave
// page scrolling alone, and only the selected option is in the tab order.
export const SegmentedControl = <T extends number | string>(
  props: SegmentedControlProps<T>,
) => {
  const options = createMemo(() => {
    type Option = {
      description?: string;
      icon?: JSX.Element;
      label: string;
      value: null | T;
    };
    const map = new Map<string, Option>();
    if (props.allLabel !== undefined) {
      map.set(ALL_KEY, { label: props.allLabel, value: null });
    }
    for (const item of props.items) map.set(keyOf(item.value), item);
    return map;
  });
  // Rows are keyed by value, so rebuilt option arrays keep their buttons
  // (and focus) instead of replacing them.
  const keys = createMemo(() => options().keys().toArray());

  const selectedKey = (): string | undefined => {
    if (props.value !== null && props.value !== undefined) {
      return keyOf(props.value);
    }
    return props.allLabel === undefined ? undefined : ALL_KEY;
  };
  const tabKey = () => {
    const selected = selectedKey();
    return selected !== undefined && options().has(selected)
      ? selected
      : keys()[0];
  };

  const choose = (key: string) => {
    const option = options().get(key);
    if (!option || key === selectedKey()) return;
    if (option.value === null) props.onClear?.();
    else props.onSelect(option.value);
  };

  let container: HTMLDivElement | undefined;

  const buttons = () =>
    container === undefined
      ? []
      : [...container.querySelectorAll<HTMLElement>('[role="radio"]')];

  const moveTo = (target: HTMLElement | undefined) => {
    const key = target?.dataset['key'];
    if (key === undefined) return;
    choose(key);
    queueMicrotask(() => {
      container
        ?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)
        ?.focus();
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const list = buttons();
    const current = event.target as HTMLElement;
    const index = list.indexOf(current);
    if (index === -1 || list.length === 0) return;
    const count = list.length;
    const horizontal = new Map<string, number>([
      ['ArrowLeft', (index - 1 + count) % count],
      ['ArrowRight', (index + 1) % count],
      ['End', count - 1],
      ['Home', 0],
    ]);
    const horizontalIndex = horizontal.get(event.key);
    let target: HTMLElement | undefined;
    if (horizontalIndex !== undefined) {
      target = list[horizontalIndex];
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      target = findVerticalNeighbor(
        list,
        current,
        event.key === 'ArrowDown' ? 1 : -1,
      );
      // A single row has nothing above or below: let the page scroll.
      if (!target) return;
    } else {
      return;
    }
    event.preventDefault();
    moveTo(target);
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
      style={{
        '--segments': String(
          Math.max(1, Math.min(keys().length, MAX_MOBILE_COLUMNS)),
        ),
      }}
    >
      <For each={keys()}>
        {(key) => {
          const option = () => options().get(key);
          const selected = () => key === selectedKey();
          return (
            <button
              aria-checked={selected()}
              aria-label={
                option()?.description === undefined
                  ? undefined
                  : `${option()?.label ?? ''}: ${option()?.description ?? ''}`
              }
              class={cn(
                OPTION_BASE,
                OPTION_SIZES[props.size ?? 'md'],
                'sm:flex-none',
                selected()
                  ? 'bg-raised text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-raised/60',
              )}
              data-key={key}
              onClick={() => {
                choose(key);
              }}
              role="radio"
              tabIndex={key === tabKey() ? 0 : -1}
              title={option()?.description}
              type="button"
            >
              {option()?.icon}
              {option()?.label}
            </button>
          );
        }}
      </For>
    </div>
  );
};
