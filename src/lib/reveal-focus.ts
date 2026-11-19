import { onCleanup } from 'solid-js';

// Browsers only scroll a focused element into view when it is outside the
// viewport, so one under the sticky tab bar or simulator header would stay
// covered (WCAG 2.4.11). This scrolls it clear, by the page's own
// scroll-padding-top, which accounts for those bars.

const isInStickyLayer = (element: Element): boolean => {
  for (
    let current: Element | null = element;
    current !== null && current !== document.body;
    current = current.parentElement
  ) {
    const { position } = getComputedStyle(current);
    if (position === 'sticky' || position === 'fixed') return true;
  }
  return false;
};

// Keyboard focus only: a click lands on something already in view.
const revealFocusedElement = (event: FocusEvent): void => {
  const { target } = event;
  if (
    !(target instanceof Element) ||
    !target.matches(':focus-visible') ||
    isInStickyLayer(target)
  ) {
    return;
  }
  const clearance =
    Number.parseFloat(
      getComputedStyle(document.documentElement).scrollPaddingTop,
    ) || 0;
  const { top } = target.getBoundingClientRect();
  if (top < clearance) {
    scrollBy({ behavior: 'instant', top: top - clearance });
  }
};

// Keeps keyboard focus clear of the sticky bars while the app is mounted.
export const useRevealFocus = (): void => {
  document.addEventListener('focusin', revealFocusedElement);
  onCleanup(() => {
    document.removeEventListener('focusin', revealFocusedElement);
  });
};
