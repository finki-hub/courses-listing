import {
  type Accreditation,
  type CourseRaw,
  getAccreditationInfo,
} from '@/types/course';

type StorageKeyMaps = {
  readonly codeToName: ReadonlyMap<string, string>;
  readonly nameToCode: ReadonlyMap<string, string>;
};

// The simulator works with course names, but saves progress by course code,
// so a course renamed in the data keeps what the student marked.
const getStorageKeyMaps = (
  courses: readonly CourseRaw[],
  accreditation: Accreditation,
): StorageKeyMaps => {
  const codeToName = new Map<string, string>();
  const nameToCode = new Map<string, string>();
  for (const course of courses) {
    const info = getAccreditationInfo(course, accreditation);
    if (!info?.code) continue;
    const name = info.name ?? course.name;
    codeToName.set(info.code, name);
    nameToCode.set(name, info.code);
  }
  return { codeToName, nameToCode };
};

/**
 * Re-keys a record by course name for saving: each course known in the
 * accreditation gets its code; anything else keeps its key.
 *
 * @param record - Values by course name
 * @param courses - Every course, to look up codes
 * @param accreditation - The accreditation whose codes are used
 * @returns The values by course code
 */
export const toStorageKeys = <T>(
  record: Readonly<Record<string, T>>,
  courses: readonly CourseRaw[],
  accreditation: Accreditation,
): Record<string, T> => {
  const { nameToCode } = getStorageKeyMaps(courses, accreditation);
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      nameToCode.get(key) ?? key,
      value,
    ]),
  );
};

/**
 * Re-keys a saved record by course name. Codes become today's names; older
 * records saved by name, and courses no longer offered, keep their keys. A
 * code wins over a name saved for the same course.
 *
 * @param record - Values as saved
 * @param courses - Every course, to look up names
 * @param accreditation - The accreditation whose codes were used
 * @returns The values by course name
 */
export const fromStorageKeys = <T>(
  record: Readonly<Record<string, T>>,
  courses: readonly CourseRaw[],
  accreditation: Accreditation,
): Record<string, T> => {
  const { codeToName } = getStorageKeyMaps(courses, accreditation);
  const byName: Record<string, T> = {};
  const byCode: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const name = codeToName.get(key);
    if (name === undefined) byName[key] = value;
    else byCode[name] = value;
  }
  return { ...byName, ...byCode };
};
