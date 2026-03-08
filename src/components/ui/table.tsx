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
      class={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        props.class,
      )}
      {...rest}
    />
  );
};

export const TableHead = (props: ComponentProps<'th'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <th
      class={cn(
        'text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
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
      class={cn(
        'whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        props.class,
      )}
      {...rest}
    />
  );
};
