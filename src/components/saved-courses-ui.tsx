import { createSignal, onCleanup, Show } from 'solid-js';

import { EmptyState } from '@/components/ui/empty-state';
import { Bookmark, Check, Link2, Star } from '@/components/ui/icons';
import { formatCount, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { cn } from '@/lib/utils';

const STATUS_RESET_DELAY_MS = 2_000;

type SaveButtonProps = {
  readonly class?: string;
  /** The name the course is shown by. */
  readonly courseName: string;
  readonly onToggle: () => void;
  readonly saved: boolean;
};

// A star that saves a course to the shortlist. It sits in clickable rows, so
// its clicks never reach them.
export const SaveButton = (props: SaveButtonProps) => {
  const { t } = useLanguage();
  const label = () => interpolate(t().saved.save, { course: props.courseName });
  return (
    <button
      aria-label={label()}
      aria-pressed={props.saved ? 'true' : 'false'}
      class={cn(
        'focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:outline-none',
        props.saved ? 'text-saved' : 'text-muted-foreground',
        props.class,
      )}
      onClick={(event) => {
        event.stopPropagation();
        props.onToggle();
      }}
      title={label()}
      type="button"
    >
      <Star
        aria-hidden="true"
        class={cn('h-4 w-4', props.saved && 'fill-current')}
      />
    </button>
  );
};

// Copies a link to the saved courses; the icon and a status confirm it.
export const ShareSavedButton = (props: {
  readonly onShare: () => Promise<boolean>;
}) => {
  const { t } = useLanguage();
  const [state, setState] = createSignal<'done' | 'error' | 'idle'>('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => {
    clearTimeout(timer);
  });
  const share = async () => {
    setState((await props.onShare()) ? 'done' : 'error');
    clearTimeout(timer);
    timer = setTimeout(() => {
      setState('idle');
    }, STATUS_RESET_DELAY_MS);
  };
  return (
    <>
      <button
        class="text-primary focus-visible:ring-ring inline-flex min-h-6 items-center gap-1.5 rounded-sm text-sm font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => {
          void share();
        }}
        type="button"
      >
        <Show
          fallback={
            <Link2
              aria-hidden="true"
              class="h-4 w-4"
            />
          }
          when={state() === 'done'}
        >
          <Check
            aria-hidden="true"
            class="h-4 w-4"
          />
        </Show>
        {t().filters.shareSaved}
      </button>
      <span
        class="sr-only"
        role="status"
      >
        {state() === 'done' ? t().filters.savedLinkCopied : ''}
        {state() === 'error' ? t().filters.savedLinkFailed : ''}
      </span>
    </>
  );
};

type SharedSavedBannerProps = {
  readonly saved: {
    readonly addShared: () => void;
    readonly shared: () => null | readonly string[];
    readonly showMine: () => void;
  };
};

const BANNER_BUTTON =
  'hover:bg-muted focus-visible:ring-ring inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none';

// Shown while a link's saved courses are listed: they can join the
// student's own, which a link never overwrites.
export const SharedSavedBanner = (props: SharedSavedBannerProps) => {
  const { language, t } = useLanguage();
  return (
    <Show when={props.saved.shared()}>
      {(shared) => (
        <div
          class="bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-3 py-2 text-sm"
          role="status"
        >
          <span class="inline-flex items-center gap-2">
            <Bookmark
              aria-hidden="true"
              class="text-muted-foreground h-4 w-4"
            />
            {formatCount(t().saved.sharedBanner, {
              count: shared().length,
              language: language(),
            })}
          </span>
          <span class="flex flex-wrap gap-2">
            <button
              class={BANNER_BUTTON}
              onClick={() => {
                props.saved.addShared();
              }}
              type="button"
            >
              {t().saved.addShared}
            </button>
            <button
              class={BANNER_BUTTON}
              onClick={() => {
                props.saved.showMine();
              }}
              type="button"
            >
              {t().saved.showMine}
            </button>
          </span>
        </div>
      )}
    </Show>
  );
};

// The Saved filter is on, but nothing is saved: say how to save.
export const NoSavedCourses = () => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={<Star />}
      text={t().saved.emptyText}
      title={t().saved.emptyTitle}
    />
  );
};
