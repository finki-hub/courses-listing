import { createSignal, onMount, Show } from 'solid-js';

type Theme = 'dark' | 'light';

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme') as null | Theme;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
};

export const ThemeToggle = () => {
  const [theme, setTheme] = createSignal<Theme>(getInitialTheme());

  const applyTheme = (t: Theme) => {
    document.documentElement.dataset['kbTheme'] = t;
    localStorage.setItem('theme', t);
  };

  onMount(() => {
    applyTheme(theme());
  });

  const toggle = () => {
    const next = theme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      aria-label="Промени тема"
      class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={toggle}
    >
      <Show
        fallback={
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        }
        when={theme() === 'dark'}
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
          />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </Show>
    </button>
  );
};
