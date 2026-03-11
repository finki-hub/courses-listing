const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ѓ: 'gj',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  ѕ: 'dz',
  и: 'i',
  ј: 'j',
  к: 'k',
  ќ: 'kj',
  л: 'l',
  љ: 'lj',
  м: 'm',
  н: 'n',
  њ: 'nj',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  џ: 'dzh',
  ш: 'sh',
};

const LATIN_EQUIVALENTS: Array<[string, string]> = [
  ['dž', 'dzh'],
  ['dj', 'gj'],
  ['đ', 'gj'],
  ['ǵ', 'gj'],
  ['kj', 'kj'],
  ['ḱ', 'kj'],
  ['lj', 'lj'],
  ['nj', 'nj'],
  ['zh', 'zh'],
  ['ž', 'zh'],
  ['ch', 'ch'],
  ['č', 'ch'],
  ['sh', 'sh'],
  ['š', 'sh'],
  ['dz', 'dz'],
  ['c', 'c'],
];

const transliterateToLatin = (value: string) => {
  let result = '';

  for (const character of value) {
    result += CYRILLIC_TO_LATIN[character] ?? character;
  }

  return result;
};

const normalizeLatinVariants = (value: string) => {
  let normalized = value;

  for (const [from, to] of LATIN_EQUIVALENTS) {
    normalized = normalized.replaceAll(from, to);
  }

  return normalized;
};

export const normalizeSearchText = (value: string) =>
  normalizeLatinVariants(transliterateToLatin(value.toLowerCase()))
    .normalize('NFKD')
    .replaceAll(/\p{Mark}+/gu, '')
    .replaceAll(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replaceAll(/\s+/gu, ' ');

export const matchesNormalizedSearch = (value: string, searchTerm: string) => {
  const normalizedSearch = normalizeSearchText(searchTerm);
  if (!normalizedSearch) return true;

  return normalizeSearchText(value).includes(normalizedSearch);
};
