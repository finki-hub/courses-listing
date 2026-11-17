import { SearchX } from 'lucide-solid';
import { type JSX, Show } from 'solid-js';

import { EmptyState } from '@/components/ui/empty-state';
import { Sheet } from '@/components/ui/sheet';
import { formatCount } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

const CLEAR_LINK_CLASS =
  'text-primary text-xs font-medium underline-offset-2 hover:underline';

type FramesProps = {
  readonly activeFilters: number;
  readonly children: JSX.Element;
  readonly onClear: () => void;
};

// The filters beside the results on desktop widths.
export const FiltersSidebar = (props: FramesProps) => {
  const { t } = useLanguage();
  return (
    <aside
      aria-label={t().filters.panelTitle}
      class="bg-card sticky top-16 hidden max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-lg border px-4 py-2 lg:block"
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
  readonly resultCount: number;
};

// The filters below desktop widths: a sheet whose footer shows how many
// courses they leave and returns to them.
export const FiltersSheet = (props: FiltersSheetProps) => {
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
            {formatCount(t().filters.showResults, {
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

// No course matches: say so and offer to clear what narrowed the list.
export const NoResults = (props: {
  readonly canClear: boolean;
  readonly onClear: () => void;
}) => {
  const { t } = useLanguage();
  return (
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
  );
};
