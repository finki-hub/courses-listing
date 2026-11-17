import { Check, Link2, LoaderCircle, TriangleAlert } from 'lucide-solid';
import { createSignal, Match, onCleanup, Switch } from 'solid-js';

import { useLanguage } from '@/lib/LanguageProvider';
import { cn } from '@/lib/utils';

import { SIMULATOR_ACTION_CLASS } from './course-styles';

type ShareState = 'copying' | 'done' | 'error' | 'idle';

const SHARE_STATE_CLASSES: Record<ShareState, string> = {
  copying: 'cursor-wait',
  done: 'border-passed-border bg-passed-soft text-passed',
  error: 'border-danger-border bg-danger-soft text-danger',
  idle: 'bg-card hover:bg-muted',
};

const STATUS_RESET_DELAY_MS = 2_000;

// Copies a link to the current simulator state; the icon confirms the copy.
export const ShareButton = (props: { onShare: () => Promise<boolean> }) => {
  const { t } = useLanguage();

  const [state, setState] = createSignal<ShareState>('idle');
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => {
    clearTimeout(resetTimer);
  });

  const handle = async () => {
    if (state() !== 'idle') return;
    setState('copying');
    try {
      const ok = await props.onShare();
      setState(ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
    resetTimer = setTimeout(() => {
      setState('idle');
    }, STATUS_RESET_DELAY_MS);
  };

  return (
    <button
      aria-label={t().simulator.copyLink}
      class={cn(SIMULATOR_ACTION_CLASS, SHARE_STATE_CLASSES[state()])}
      disabled={state() !== 'idle'}
      onClick={() => {
        void handle();
      }}
      title={t().simulator.copyLink}
      type="button"
    >
      <Switch
        fallback={
          <Link2
            aria-hidden="true"
            class="h-4 w-4"
          />
        }
      >
        <Match when={state() === 'copying'}>
          <LoaderCircle
            aria-hidden="true"
            class="h-4 w-4 animate-spin motion-reduce:animate-none"
          />
        </Match>
        <Match when={state() === 'done'}>
          <Check
            aria-hidden="true"
            class="h-4 w-4"
          />
        </Match>
        <Match when={state() === 'error'}>
          <TriangleAlert
            aria-hidden="true"
            class="h-4 w-4"
          />
        </Match>
      </Switch>
      <span class="hidden sm:inline">{t().simulator.share}</span>
    </button>
  );
};
