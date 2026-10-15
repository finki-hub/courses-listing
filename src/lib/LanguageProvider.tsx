import {
  type Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type ParentProps,
  useContext,
} from 'solid-js';

import {
  isLanguage,
  type Language,
  translations,
  type Translations,
} from './i18n';
import { updatePageMetadata } from './page-metadata';
import { readBrowserStorage, writeBrowserStorage } from './safe-storage';

type LanguageContextValue = {
  language: Accessor<Language>;
  setLanguage: (language: Language) => void;
  t: Accessor<Translations>;
};

const LanguageContext = createContext<LanguageContextValue>();

export const LanguageProvider = (props: ParentProps) => {
  const saved = readBrowserStorage('finki-hub-lang');
  const [language, setLanguage] = createSignal<Language>(
    isLanguage(saved) ? saved : 'mk',
  );
  createEffect(() => {
    updatePageMetadata(language(), document);
  });
  const t = createMemo(() => translations[language()]);
  const value: LanguageContextValue = {
    language,
    setLanguage: (next) => {
      setLanguage(next);
      writeBrowserStorage('finki-hub-lang', next);
    },
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {props.children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
