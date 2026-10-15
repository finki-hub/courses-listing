import { Moon, Sun } from 'lucide-solid';
import { createSignal, onMount, Show } from 'solid-js';

import { IconButton } from '@/components/ui/icon-controls';
import { useLanguage } from '@/lib/LanguageProvider';

type Theme = 'dark' | 'light';

const STORAGE_KEY_THEME = 'theme';

const isTheme = (v: null | string): v is Theme => v === 'dark' || v === 'light';

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (isTheme(stored)) return stored;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeToggle = () => {
  const { t } = useLanguage();

  const [theme, setTheme] = createSignal<Theme>(getInitialTheme());

  const applyTheme = (nextTheme: Theme) => {
    document.documentElement.dataset['kbTheme'] = nextTheme;
    localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
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
      aria-label={t().common.toggleTheme}
      onClick={toggle}
    >
      <Show
        fallback={<Moon class="h-4 w-4" />}
        when={theme() === 'dark'}
      >
        <Sun class="h-4 w-4" />
      </Show>
    </IconButton>
  );
};
