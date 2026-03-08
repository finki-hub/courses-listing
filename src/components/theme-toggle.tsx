import { createSignal, onMount, Show } from 'solid-js';

import { IconButton } from '@/components/ui/icon-controls';
import { MoonIcon, SunIcon } from '@/components/ui/icons';

type Theme = 'dark' | 'light';

const STORAGE_KEY_THEME = 'theme';

const isTheme = (v: null | string): v is Theme => v === 'dark' || v === 'light';

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (isTheme(stored)) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const ThemeToggle = () => {
  const [theme, setTheme] = createSignal<Theme>(getInitialTheme());

  const applyTheme = (t: Theme) => {
    document.documentElement.dataset['kbTheme'] = t;
    localStorage.setItem(STORAGE_KEY_THEME, t);
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
    <IconButton
      aria-label="Промени тема"
      onClick={toggle}
    >
      <Show
        fallback={<MoonIcon class="h-4 w-4" />}
        when={theme() === 'dark'}
      >
        <SunIcon class="h-4 w-4" />
      </Show>
    </IconButton>
  );
};
