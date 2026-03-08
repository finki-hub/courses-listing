import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

export const Table = (props: ComponentProps<'table'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div class="relative w-full overflow-x-auto">
      <table
        class={cn('w-full caption-bottom text-sm', props.class)}
        {...rest}
      />
    </div>
  );
};

export const TableHeader = (props: ComponentProps<'thead'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <thead
      class={cn('[&_tr]:border-b', props.class)}
      {...rest}
    />
  );
};

export const TableBody = (props: ComponentProps<'tbody'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <tbody
      class={cn('[&_tr:last-child]:border-0', props.class)}
      {...rest}
    />
  );
};

export const TableRow = (props: ComponentProps<'tr'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <tr
      class={cn('hover:bg-muted/50 border-b transition-colors', props.class)}
      {...rest}
    />
  );
};

export const TableHead = (props: ComponentProps<'th'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <th
      class={cn(
        'text-foreground h-10 whitespace-nowrap px-1.5 text-left align-middle text-xs font-medium sm:px-2 sm:text-sm',
        props.class,
      )}
      {...rest}
    />
  );
};

export const TableCell = (props: ComponentProps<'td'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <td
      class={cn('px-1.5 py-1.5 align-middle sm:p-2', props.class)}
      {...rest}
    />
  );
};
