import { createSignal, Show } from 'solid-js';

type ScreenshotState = 'capturing' | 'done' | 'error' | 'idle';

const SCREENSHOT_STATE_CLASSES: Record<ScreenshotState, string> = {
  capturing: 'cursor-wait opacity-70',
  done: 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
  error: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400',
  idle: 'hover:bg-muted',
};

const STATUS_RESET_DELAY_MS = 2_000;

export const ScreenshotButton = (props: {
  class?: string;
  onCapture: () => Promise<boolean>;
}) => {
  const [state, setState] = createSignal<ScreenshotState>('idle');

  const handle = async () => {
    if (state() !== 'idle') return;
    setState('capturing');
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    try {
      const ok = await props.onCapture();
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
      class={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${props.class ?? ''} ${SCREENSHOT_STATE_CLASSES[state()]}`}
      disabled={state() !== 'idle'}
      onClick={() => {
        void handle();
      }}
      title="Генерирај слика од табелата"
      type="button"
    >
      <Show
        fallback="📷 Сликај"
        when={state() !== 'idle'}
      >
        <Show when={state() === 'capturing'}>
          <span class="inline-block animate-spin">⏳</span> Генерирање...
        </Show>
        <Show when={state() === 'done'}>✅ Успешно!</Show>
        <Show when={state() === 'error'}>❌ Неуспешно</Show>
      </Show>
    </button>
  );
};
