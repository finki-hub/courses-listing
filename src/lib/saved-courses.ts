import {
  findCourseByLinkValue,
  getCourseLinkValue,
  SHARED_SAVED_PARAM,
} from '@/lib/listing-url-state';
import { type CourseRaw } from '@/types/course';

// Saved courses are kept by course link value (the newest code, else the
// name), so master's courses without codes can be saved too.

export const SAVED_COURSES_STORAGE_KEY = 'finki-hub-saved-courses';
export const SAVED_PARAM = SHARED_SAVED_PARAM;

const MAX_SAVED = 1_000;
const MAX_VALUE_LENGTH = 200;
const VALUE_SEPARATOR = ',';

// Distinct, non-empty, reasonably sized values, in their first-seen order.
const sanitizeValues = (values: readonly unknown[]): string[] => {
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed === '' || trimmed.length > MAX_VALUE_LENGTH) continue;
    seen.add(trimmed);
    if (seen.size >= MAX_SAVED) break;
  }
  return [...seen];
};

/**
 * Reads the saved values from what was stored, tolerating anything.
 *
 * @param raw - The stored text, if any
 * @returns The saved values, empty when the text is not a list of strings
 */
export const parseSavedStorage = (raw: null | string): string[] => {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? sanitizeValues(parsed) : [];
  } catch {
    return [];
  }
};

export const serializeSavedStorage = (values: readonly string[]): string =>
  JSON.stringify(sanitizeValues(values));

const decodeValue = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Reads the saved values of a link. Each value is percent-encoded, so a name
 * with a comma in it survives.
 *
 * @param raw - The `saved` param, if any
 * @returns The values in the link
 */
export const parseSavedParam = (raw: null | string): string[] =>
  raw === null || raw === ''
    ? []
    : sanitizeValues(
        raw.split(VALUE_SEPARATOR).map((part) => decodeValue(part)),
      );

export const serializeSavedParam = (values: readonly string[]): string =>
  sanitizeValues(values)
    .map((value) => encodeURIComponent(value))
    .join(VALUE_SEPARATOR);

/**
 * The link values of the known courses among the given values, so codes
 * that are no longer in the data (or typos) are dropped.
 *
 * @param courses - Every course
 * @param values - Values from storage or a link: codes or names
 * @returns The link values of the courses found, without duplicates
 */
export const resolveSavedValues = (
  courses: readonly CourseRaw[],
  values: readonly string[],
): string[] =>
  sanitizeValues(
    values.map((value) => {
      const course = findCourseByLinkValue(courses, value);
      return course === undefined ? undefined : getCourseLinkValue(course);
    }),
  );

export const toggleSavedValue = (
  values: readonly string[],
  value: string,
): string[] =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : sanitizeValues([...values, value]);

export const mergeSavedValues = (
  values: readonly string[],
  added: readonly string[],
): string[] => sanitizeValues([...values, ...added]);

/**
 * A link to the listing that shows the given saved courses.
 *
 * @param href - The current address, whose origin and path are kept
 * @param values - The link values to share
 * @returns The link
 */
export const getSavedShareUrl = (
  href: string,
  values: readonly string[],
): string => {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  url.searchParams.set(SAVED_PARAM, serializeSavedParam(values));
  // Keep the separators readable; a comma inside a name stays encoded twice.
  url.search = url.search.replaceAll('%2C', ',');
  return url.href;
};
