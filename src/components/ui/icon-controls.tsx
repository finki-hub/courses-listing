import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

type IconButtonProps = ComponentProps<'button'>;

const ICON_BUTTON_CLASS =
  'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export const IconButton = (props: IconButtonProps) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <button
      class={cn(ICON_BUTTON_CLASS, local.class)}
      {...rest}
    />
  );
};

type IconLinkProps = ComponentProps<'a'>;

export const IconLink = (props: IconLinkProps) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <a
      class={cn(ICON_BUTTON_CLASS, local.class)}
      {...rest}
    />
  );
};
