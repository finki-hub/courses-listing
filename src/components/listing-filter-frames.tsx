import { type JSX } from '@solidjs/web';
import { createEffect, Show } from 'solid-js';

import { NoSavedCourses } from '@/components/saved-courses-ui';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchX } from '@/components/ui/icons';
import { Sheet } from '@/components/ui/sheet';
import { formatCount } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { LARGE_SCREEN_QUERY, useMediaQuery } from '@/lib/use-media-query';

const CLEAR_LINK_CLASS =
  'text-primary text-xs font-medium underline-offset-2 hover:underline';

type FramesProps = {
  readonly activeFilters: number;
  readonly children: JSX.Element;
  readonly onClear: () => void;
};

// The filters beside the results on desktop widths.
const FiltersSidebar = (props: FramesProps) => {
  const { t } = useLanguage();
  return (
    <aside
      aria-label={t().filters.panelTitle}
      class="bg-card sticky top-[calc(var(--tabbar-h,3rem)+1rem)] max-h-[calc(100dvh-var(--tabbar-h,3rem)-2rem)] overflow-y-auto rounded-lg border px-4 py-2"
    >
      <div class="flex items-center justify-between gap-2 border-b py-2">
        <h2 class="text-sm font-semibold">{t().filters.panelTitle}</h2>
        <Show when={props.activeFilters > 0}>
          <button
            class={CLEAR_LINK_CLASS}
            onClick={() => {
              props.onClear();
            }}
            type="button"
          >
            {t().filters.clearAll}
          </button>
        </Show>
      </div>
      {props.children}
    </aside>
  );
};

type FiltersSheetProps = FramesProps & {
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  /** Unknown while the master's programs load. */
  readonly resultCount: number | undefined;
};

// The filters below desktop widths: a sheet whose footer shows how many
// courses they leave and returns to them.
const FiltersSheet = (props: FiltersSheetProps) => {
  const { language, t } = useLanguage();
  return (
    <Sheet
      footer={
        <>
          <Show when={props.activeFilters > 0}>
            <button
              class="hover:bg-muted mr-auto inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors"
              onClick={() => {
                props.onClear();
              }}
              type="button"
            >
              {t().filters.clearAll}
            </button>
          </Show>
          <button
            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors"
            onClick={() => {
              props.onOpenChange(false);
            }}
            type="button"
          >
            {props.resultCount === undefined
              ? t().filters.showCourses
              : formatCount(t().filters.showResults, {
                  count: props.resultCount,
                  language: language(),
                })}
          </button>
        </>
      }
      onOpenChange={props.onOpenChange}
      open={props.open}
      side="left"
      title={t().filters.panelTitle}
    >
      {props.children}
    </Sheet>
  );
};

// The one filter panel: in the sidebar from the desktop width, else in the
// sheet, which closes by itself once the window grows to that width.
export const FiltersFrame = (props: FiltersSheetProps) => {
  const wide = useMediaQuery(LARGE_SCREEN_QUERY);
  createEffect(
    () => [wide(), props.open] as const,
    ([isWide, isOpen]) => {
      if (isWide && isOpen) props.onOpenChange(false);
    },
  );
  return (
    <Show
      fallback={<FiltersSheet {...props} />}
      when={wide()}
    >
      <FiltersSidebar {...props} />
    </Show>
  );
};

// No course matches: say so and offer to clear what narrowed the list.
export const NoResults = (props: {
  readonly canClear: boolean;
  /** The Saved filter is on and nothing is saved. */
  readonly noneSaved?: boolean;
  readonly onClear: () => void;
}) => {
  const { t } = useLanguage();
  return (
    <Show
      fallback={
        <EmptyState
          action={
            <Show when={props.canClear}>
              <button
                class="bg-card hover:bg-muted inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors"
                onClick={() => {
                  props.onClear();
                }}
                type="button"
              >
                {t().filters.clearFilters}
              </button>
            </Show>
          }
          icon={<SearchX />}
          text={t().listing.noResultsText}
          title={t().listing.noResultsTitle}
        />
      }
      when={props.noneSaved}
    >
      <NoSavedCourses />
    </Show>
  );
};
