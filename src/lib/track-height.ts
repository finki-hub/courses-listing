import { onCleanup } from 'solid-js';

// Publishes an element's height as a CSS custom property on the root while
// the element is mounted, so sticky layers can stack and scrolling can keep
// focused content out from under them.
//
// The ref callback only starts observing; the component body owns the
// cleanup, because Solid 2 forbids `onCleanup` inside a ref callback.
export const createHeightTracker = (
  property: string,
): ((element: HTMLElement) => void) => {
  const root = document.documentElement;
  let element: HTMLElement | undefined;
  let observer: ResizeObserver | undefined;

  const stop = () => {
    observer?.disconnect();
    observer = undefined;
    if (element) root.style.removeProperty(property);
    element = undefined;
  };

  onCleanup(stop);

  return (next) => {
    if (element === next) return;
    stop();
    element = next;
    const update = () => {
      root.style.setProperty(
        property,
        `${String(element?.getBoundingClientRect().height ?? 0)}px`,
      );
    };
    update();
    observer = new ResizeObserver(update);
    observer.observe(next);
  };
};
