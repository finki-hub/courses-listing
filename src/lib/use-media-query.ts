import {
  type Accessor,
  createRoot,
  createSignal,
  runWithOwner,
} from 'solid-js';

const queries = new Map<string, Accessor<boolean>>();

// Whether a media query matches, as a signal shared by every caller of the
// same query: one listener per query for the page's lifetime.
export const useMediaQuery = (query: string): Accessor<boolean> => {
  const known = queries.get(query);
  if (known) return known;

  // Detach the root from the caller: the query lives for the page, not for
  // the component that first asked for it. Solid 2 disposes owned roots with
  // their parent, which would otherwise kill the listener on a tab switch.
  const matches = runWithOwner(null, () =>
    createRoot(() => {
      const media =
        typeof matchMedia === 'function' ? matchMedia(query) : undefined;
      const [value, setValue] = createSignal(media?.matches ?? false);
      media?.addEventListener('change', (event) => {
        setValue(event.matches);
      });
      return value;
    }),
  );
  queries.set(query, matches);
  return matches;
};

// The Tailwind breakpoints the listing switches layouts at.
export const SMALL_SCREEN_QUERY = '(min-width: 640px)';
export const LARGE_SCREEN_QUERY = '(min-width: 1024px)';
