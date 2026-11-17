import { For } from 'solid-js';

import { cn } from '@/lib/utils';

type SkeletonProps = { class?: string };

// A placeholder block while content loads; still under reduced motion.
export const Skeleton = (props: SkeletonProps) => (
  <div
    aria-hidden="true"
    class={cn('bg-muted rounded-md motion-safe:animate-pulse', props.class)}
  />
);

type ListingSkeletonProps = {
  /** Read aloud while loading. */
  label: string;
  rows?: number;
};

// The outline of the course listing: search, filters and table rows.
export const ListingSkeleton = (props: ListingSkeletonProps) => (
  <div
    aria-busy="true"
    aria-label={props.label}
    class="space-y-4"
    role="status"
  >
    <Skeleton class="h-10 w-full" />
    <div class="flex flex-wrap gap-2">
      <Skeleton class="h-9 w-40" />
      <Skeleton class="h-9 w-48" />
      <Skeleton class="h-9 w-36" />
    </div>
    <div class="bg-card space-y-px overflow-hidden rounded-lg border">
      <For each={Array.from({ length: props.rows ?? 8 }, (_, index) => index)}>
        {(index) => (
          <div class="flex items-center gap-4 px-4 py-3">
            <Skeleton class={cn('h-4', index % 3 === 0 ? 'w-1/3' : 'w-1/4')} />
            <Skeleton class="ml-auto hidden h-4 w-16 sm:block" />
            <Skeleton class="hidden h-4 w-10 sm:block" />
            <Skeleton class="h-5 w-20 rounded-full" />
          </div>
        )}
      </For>
    </div>
    <span class="sr-only">{props.label}</span>
  </div>
);
