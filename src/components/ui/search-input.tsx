import type { JSX } from 'solid-js';

type SearchInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'class' | 'type'
>;

export const SearchInput = (props: SearchInputProps) => (
  <input
    class="bg-background border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    type="text"
    {...props}
  />
);
