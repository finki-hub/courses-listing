import { createSignal } from 'solid-js';

import { Wand2 } from '@/components/ui/icons';
import { InfoTip } from '@/components/ui/info-tip';
import { capture } from '@/lib/analytics-client';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

import { useUndoableAction } from './undo-notice';

type FillRequiredProps = {
  onFill: () => { added: number; undo: () => void };
  /** Required courses not taken or planned yet. */
  remaining: number;
};

// Plans every remaining required course at once, with a moment to undo it.
export const FillRequired = (props: FillRequiredProps) => {
  const { t } = useLanguage();
  const undo = useUndoableAction();
  const [added, setAdded] = createSignal(0);

  const fill = () => {
    const result = props.onFill();
    setAdded(result.added);
    // eslint-disable-next-line camelcase -- PostHog event props are snake_case
    capture('plan_filled', { result_count: result.added });
    if (result.added > 0) undo.offer(result.undo);
  };

  return (
    <div class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="bg-card hover:bg-muted focus-visible:ring-ring inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={props.remaining === 0}
          onClick={fill}
          type="button"
        >
          <Wand2
            aria-hidden="true"
            class="text-primary h-4 w-4"
          />
          {t().planner.fill}
        </button>
        <InfoTip text={t().planner.fillInfo} />
        <span class="text-muted-foreground text-sm">
          {props.remaining === 0
            ? t().planner.nothingToFill
            : interpolate(t().planner.unplannedRequired, {
                count: props.remaining,
              })}
        </span>
      </div>
      <undo.Notice
        message={interpolate(t().planner.filled, { count: added() })}
      />
    </div>
  );
};
