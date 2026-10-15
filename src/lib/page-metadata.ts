import { type Language, translations } from './i18n.ts';

const openGraphLocales: Record<Language, string> = {
  en: 'en_GB',
  mk: 'mk_MK',
  sq: 'sq_AL',
  tr: 'tr_TR',
};

const getPageMetadata = (language: Language) => {
  const t = translations[language];
  return {
    author: t.brand,
    description: t.metadataDescription,
    language,
    locale: openGraphLocales[language],
    title: t.appTitle,
  };
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

export const localizeHtml = (
  html: string,
  language: Language = 'mk',
): string => {
  let localized = html;
  const entries = Object.entries(getPageMetadata(language));
  for (const [key, value] of entries) {
    localized = localized.replaceAll(`__LOCALIZED_${key.toUpperCase()}__`, () =>
      escapeHtml(value),
    );
  }
  return localized;
};

export const updatePageMetadata = (
  language: Language,
  page: Document,
): void => {
  const metadata = getPageMetadata(language);
  page.documentElement.lang = language;
  page.title = metadata.title;
  const tags = [
    ['meta[name="author"]', metadata.author],
    ['meta[name="description"]', metadata.description],
    ['meta[property="og:title"]', metadata.title],
    ['meta[property="og:description"]', metadata.description],
    ['meta[property="og:locale"]', metadata.locale],
    ['meta[name="twitter:title"]', metadata.title],
    ['meta[name="twitter:description"]', metadata.description],
  ] as const;
  for (const [selector, content] of tags) {
    page.head.querySelector(selector)?.setAttribute('content', content);
  }
};
