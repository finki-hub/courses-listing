import { createMemo } from 'solid-js';

import { type CourseRaw, coursesSchema } from '@/types/course';

const COURSES_URL = 'https://data.finki-hub.com/catalog/courses.json';

const fetchCourses = async (): Promise<CourseRaw[]> => {
  const response = await fetch(COURSES_URL);
  if (!response.ok)
    throw new Error(`Failed to fetch courses: ${response.statusText}`);
  const data: unknown = await response.json();
  // Undergraduate and master's courses; master's ones have cycle "second".
  return coursesSchema.parse(data);
};

// Suspends until the courses arrive; render it under a `Loading` boundary.
export const useCourses = () => createMemo(() => fetchCourses());
