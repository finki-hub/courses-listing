import { createSignal, onCleanup, Show } from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { useLanguage } from '@/lib/LanguageProvider';

const UNDO_WINDOW_MS = 8_000;

/**
 * Offers to undo an action for a few seconds, instead of asking for
 * confirmation before it.
 *
 * @returns `offer` to call after an undoable action, and the notice to render
 */
export const useUndoableAction = () => {
  const [undo, setUndo] = createSignal<(() => void) | undefined>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clear = () => {
    clearTimeout(timer);
    setUndo(undefined);
  };
  onCleanup(clear);

  // Call right after an action, with the function that reverses it.
  const offer = (restore: () => void) => {
    clearTimeout(timer);
    setUndo(() => restore);
    timer = setTimeout(clear, UNDO_WINDOW_MS);
  };

  const Notice = (props: { message: string }) => {
    const { t } = useLanguage();
    return (
      <Show when={undo()}>
        {(restore) => (
          <div
            class={`${ALERT_STYLES.info} flex items-center justify-between gap-3`}
            role="status"
          >
            <span>{props.message}</span>
            <button
              class="hover:bg-background/60 rounded-md border px-3 py-1 text-sm font-medium transition-colors"
              onClick={() => {
                restore()();
                clear();
              }}
              type="button"
            >
              {t().simulator.undo}
            </button>
          </div>
        )}
      </Show>
    );
  };

  return { dismiss: clear, Notice, offer };
};
