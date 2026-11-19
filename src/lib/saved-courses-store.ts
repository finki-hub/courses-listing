import { createRoot, createSignal } from 'solid-js';

import { getCourseLinkValue } from '@/lib/listing-url-state';
import { readBrowserStorage, writeBrowserStorage } from '@/lib/safe-storage';
import {
  mergeSavedValues,
  parseSavedStorage,
  SAVED_COURSES_STORAGE_KEY,
  serializeSavedStorage,
  toggleSavedValue,
} from '@/lib/saved-courses';
import { type CourseRaw } from '@/types/course';

// The student's own saved courses, shared by the listing and every panel.
const [values, setValues] = createRoot(() =>
  createSignal(
    parseSavedStorage(readBrowserStorage(SAVED_COURSES_STORAGE_KEY)),
  ),
);

const update = (next: string[]) => {
  setValues(next);
  writeBrowserStorage(SAVED_COURSES_STORAGE_KEY, serializeSavedStorage(next));
};

export const useSavedCourses = () => ({
  // Adds link values, such as those of a shared list.
  add: (added: readonly string[]) => {
    update(mergeSavedValues(values(), added));
  },
  isSaved: (course: CourseRaw): boolean =>
    values().includes(getCourseLinkValue(course)),
  toggle: (course: CourseRaw) => {
    update(toggleSavedValue(values(), getCourseLinkValue(course)));
  },
  values,
});
