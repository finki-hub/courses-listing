import { type Accessor, createContext, useContext } from 'solid-js';

export type CourseNames = {
  /** A catalog course name as shown in the current language. */
  courseName: (name: string) => string;
  /** The words between the courses of a prerequisite, in the language. */
  prerequisiteConnectors: (text: string) => string;
  /** A prerequisite as written, in the current language. */
  prerequisiteText: (text: string) => string;
};

export const KEEP_AS_WRITTEN: CourseNames = {
  courseName: (name) => name,
  prerequisiteConnectors: (text) => text,
  prerequisiteText: (text) => text,
};

export const CourseNamesContext = createContext<Accessor<CourseNames>>(
  () => KEEP_AS_WRITTEN,
);

// How course names show; as written outside the provider.
export const useCourseNames = (): Accessor<CourseNames> =>
  useContext(CourseNamesContext);
