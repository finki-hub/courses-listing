import type { JSX } from '@solidjs/web';

import { FIELD_CLASS } from '@/components/ui/field';
import { Search } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

type SearchInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'class' | 'type'
>;

export const SearchInput = (props: SearchInputProps) => (
  <div class="relative w-full">
    <Search
      aria-hidden="true"
      class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
    />
    <input
      class={cn(FIELD_CLASS, 'h-10 pl-9')}
      type="text"
      {...props}
    />
  </div>
);
