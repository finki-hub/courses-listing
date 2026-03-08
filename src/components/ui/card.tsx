import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

export const Card = (props: ComponentProps<'div'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn(
        'bg-card text-card-foreground rounded-xl border shadow',
        props.class,
      )}
      {...rest}
    />
  );
};

export const CardHeader = (props: ComponentProps<'div'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('flex flex-col gap-1.5 p-6', props.class)}
      {...rest}
    />
  );
};

export const CardTitle = (props: ComponentProps<'h3'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <h3
      class={cn('leading-none', props.class)}
      {...rest}
    />
  );
};

export const CardContent = (props: ComponentProps<'div'>) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('p-6 pt-0', props.class)}
      {...rest}
    />
  );
};
