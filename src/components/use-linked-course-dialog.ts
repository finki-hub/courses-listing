import { createEffect, createSignal, untrack } from 'solid-js';

import {
  COURSE_QUERY_PARAM,
  findCourseByLinkValue,
  getCourseLinkValue,
  replaceUrlParams,
} from '@/lib/listing-url-state';
import { type CourseRaw } from '@/types/course';

type FindLinkedCourse = (
  courses: readonly CourseRaw[],
  value: null | string,
) => CourseRaw | undefined;

// A course detail dialog that opens from `?course=` and keeps it in the URL.
export const useLinkedCourseDialog = (
  courses: () => readonly CourseRaw[],
  find: FindLinkedCourse = findCourseByLinkValue,
) => {
  const linkedCourse = find(
    untrack(courses),
    new URL(location.href).searchParams.get(COURSE_QUERY_PARAM),
  );

  const [course, setCourse] = createSignal<CourseRaw | null>(
    linkedCourse ?? null,
  );
  const [open, setOpen] = createSignal(linkedCourse !== undefined);

  createEffect(() => {
    const shown = open() ? course() : null;
    replaceUrlParams((params) => {
      if (shown) params.set(COURSE_QUERY_PARAM, getCourseLinkValue(shown));
      else params.delete(COURSE_QUERY_PARAM);
    });
  });

  const openCourse = (value: CourseRaw) => {
    setCourse(value);
    setOpen(true);
  };

  return { course, open, openCourse, setOpen };
};
