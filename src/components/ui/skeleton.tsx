import { For, Show } from 'solid-js';

import { cn } from '@/lib/utils';

type SkeletonProps = { class?: string };

// A placeholder block while content loads; still under reduced motion.
export const Skeleton = (props: SkeletonProps) => (
  <div
    aria-hidden="true"
    class={cn('bg-muted rounded-md motion-safe:animate-pulse', props.class)}
  />
);

type PageSkeletonProps = {
  /** Read aloud once while loading. */
  label: string;
  /** The listing's outline, or a neutral one for the other tabs. */
  variant?: 'listing' | 'page';
};

const ROW_INDEXES = Array.from({ length: 8 }, (_, index) => index);

// The outline of the course listing: the toolbar, then the filter sidebar
// (desktop) beside the result rows.
const ListingRows = () => (
  <>
    <div class="flex flex-col gap-3 sm:flex-row">
      <Skeleton class="h-10 w-full sm:w-64" />
      <Skeleton class="h-10 w-full sm:flex-1" />
    </div>
    <div class="lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-6">
      <Skeleton class="hidden h-96 rounded-lg lg:block" />
      <div class="bg-card space-y-px overflow-hidden rounded-lg border">
        <For each={ROW_INDEXES}>
          {(index) => (
            <div class="flex items-center gap-4 px-4 py-3.5">
              <div class="flex-1 space-y-1.5">
                <Skeleton
                  class={cn('h-4', index % 3 === 0 ? 'w-1/2' : 'w-1/3')}
                />
                <Skeleton class="h-3 w-24" />
              </div>
              <Skeleton class="hidden h-4 w-10 sm:block" />
              <Skeleton class="hidden h-4 w-14 sm:block" />
            </div>
          )}
        </For>
      </div>
    </div>
  </>
);

// Placeholder rows while the courses load. The status is announced once,
// through its visually hidden text.
export const PageSkeleton = (props: PageSkeletonProps) => (
  <div
    aria-busy="true"
    class="space-y-4"
    role="status"
  >
    <Show
      fallback={
        <>
          <div class="flex flex-wrap gap-2">
            <Skeleton class="h-9 w-48" />
            <Skeleton class="h-9 w-32" />
          </div>
          <div class="bg-card space-y-3 rounded-lg border p-4">
            <For each={ROW_INDEXES.slice(0, 5)}>
              {(index) => (
                <Skeleton
                  class={cn('h-4', index % 2 === 0 ? 'w-2/3' : 'w-1/2')}
                />
              )}
            </For>
          </div>
        </>
      }
      when={props.variant === 'listing'}
    >
      <ListingRows />
    </Show>
    <span class="sr-only">{props.label}</span>
  </div>
);
