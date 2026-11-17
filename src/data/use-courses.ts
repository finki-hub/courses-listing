import { createResource } from 'solid-js';

import { type CourseRaw, coursesSchema } from '@/types/course';

const COURSES_URL = 'https://data.finki-hub.com/legacy/courses.json';

const fetchCourses = async (): Promise<CourseRaw[]> => {
  const response = await fetch(COURSES_URL);
  if (!response.ok)
    throw new Error(`Failed to fetch courses: ${response.statusText}`);
  const data: unknown = await response.json();
  // The listing is the undergraduate curriculum: courses.json also carries
  // the master's courses, marked with cycle "second".
  return coursesSchema
    .parse(data)
    .filter((course) => course.cycle !== 'second');
};

export const useCourses = () => createResource(fetchCourses);
