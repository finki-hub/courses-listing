import { createContext, useContext } from 'solid-js';

import { type CourseRaw } from '@/types/course';

export type AppNavigation = {
  /** Switches to the prerequisites tab, centred on the course. */
  showPrerequisites: (course: CourseRaw) => void;
};

export const AppNavigationContext = createContext<AppNavigation>();

// Moving between tabs from inside one; undefined outside the app shell.
export const useAppNavigation = (): AppNavigation | undefined =>
  useContext(AppNavigationContext);
