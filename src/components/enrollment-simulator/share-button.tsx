import { createSignal } from 'solid-js';

type ShareState = 'copying' | 'done' | 'error' | 'idle';

const SHARE_STATE_CLASSES: Record<ShareState, string> = {
  copying: 'cursor-wait opacity-70',
  done: 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
  error: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400',
  idle: 'hover:bg-muted',
};

const STATUS_RESET_DELAY_MS = 2_000;

export const ShareButton = (props: {
  class?: string;
  onShare: () => Promise<boolean>;
}) => {
  const [state, setState] = createSignal<ShareState>('idle');

  const handle = async () => {
    if (state() !== 'idle') return;
    setState('copying');
    try {
      const ok = await props.onShare();
      setState(ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
    setTimeout(() => {
      setState('idle');
    }, STATUS_RESET_DELAY_MS);
  };

  return (
    <button
      class={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${props.class ?? ''} ${SHARE_STATE_CLASSES[state()]}`}
      disabled={state() !== 'idle'}
      onClick={() => {
        void handle();
      }}
      title="Копирај линк со тековната состојба"
      type="button"
    >
      <span class="inline-flex items-center gap-1.5">
        <span class={state() === 'copying' ? 'inline-block animate-spin' : ''}>
          {state() === 'copying' ? '⏳' : '🔗'}
        </span>
        <span>Сподели</span>
      </span>
    </button>
  );
};
