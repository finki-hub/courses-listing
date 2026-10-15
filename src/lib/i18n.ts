import { en } from './locales/en.ts';
import { mk } from './locales/mk.ts';
import { sq } from './locales/sq.ts';
import { tr } from './locales/tr.ts';

export type Language = 'en' | 'mk' | 'sq' | 'tr';

export type Translations = Localized<typeof en>;
type Localized<T> = T extends string
  ? string
  : { readonly [Key in keyof T]: Localized<T[Key]> };

export const translations: Record<Language, Translations> = { en, mk, sq, tr };

export const languageNames = {
  en: 'English',
  mk: 'Македонски',
  sq: 'Shqip',
  tr: 'Türkçe',
} as const satisfies Record<Language, string>;

export const languageLocales: Record<Language, string> = {
  en: 'en-GB',
  mk: 'mk-MK',
  sq: 'sq-AL',
  tr: 'tr-TR',
};

export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && Object.hasOwn(translations, value);

export const interpolate = (
  template: string,
  values: Record<string, number | string>,
): string =>
  template.replaceAll(/\{(?<key>\w+)\}/gu, (match, ...args) => {
    const { key } = args.at(-1) as { key: string };
    return String(values[key] ?? match);
  });

export type CountTranslations = {
  readonly one: string;
  readonly other: string;
};

export const formatNumber = (value: number, language: Language): string =>
  new Intl.NumberFormat(languageLocales[language]).format(value);

export const formatCount = (
  messages: CountTranslations,
  {
    count,
    language,
    values = {},
  }: {
    count: number;
    language: Language;
    values?: Record<string, number | string>;
  },
): string => {
  const category = new Intl.PluralRules(languageLocales[language]).select(
    count,
  );
  return interpolate(messages[category === 'one' ? 'one' : 'other'], {
    ...values,
    count: formatNumber(count, language),
  });
};

export const getTagLabel = (tag: string, t: Translations): string =>
  Object.hasOwn(t.tagLabels, tag)
    ? t.tagLabels[tag as keyof Translations['tagLabels']]
    : tag;
