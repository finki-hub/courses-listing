import { onCleanup } from 'solid-js';

// Publishes an element's height as a CSS custom property on the root while
// the element is mounted, so sticky layers can stack and scrolling can keep
// focused content out from under them.
export const trackHeight = (element: HTMLElement, property: string): void => {
  const root = document.documentElement;
  const update = () => {
    root.style.setProperty(
      property,
      `${String(element.getBoundingClientRect().height)}px`,
    );
  };
  const observer = new ResizeObserver(update);
  observer.observe(element);
  onCleanup(() => {
    observer.disconnect();
    root.style.removeProperty(property);
  });
};
