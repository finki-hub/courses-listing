import { type Accessor, createEffect, type Setter } from 'solid-js';

import { type CourseStatus } from '@/lib/prerequisite';
import {
  clampUniListCredits,
  getExclusiveProjectBlocker,
  normalizeExclusiveProjectStatuses,
  saveStatuses,
  saveUniListCredits,
  type SimulatorCourse,
  STORAGE_KEY_ACC,
  STORAGE_KEY_HPC,
  STORAGE_KEY_IGNORE_PREREQUISITES,
  STORAGE_KEY_PROGRAM,
} from '@/lib/simulator';
import { type Accreditation, type CourseRaw } from '@/types/course';

type SimulatorEffectsParams = {
  accreditation: Accessor<Accreditation>;
  enabledMap: Accessor<Record<string, boolean>>;
  hpcCompleted: Accessor<boolean>;
  ignorePrerequisites: Accessor<boolean>;
  parsedCourses: Accessor<SimulatorCourse[]>;
  /** False while a shared link is previewed, so nothing is saved. */
  persist: Accessor<boolean>;
  program: Accessor<string>;
  /** Every course, to save statuses by course code. */
  rawCourses: Accessor<CourseRaw[]>;
  setStatuses: Setter<Record<string, CourseStatus>>;
  setUniListCredits: Setter<number>;
  statuses: Accessor<Record<string, CourseStatus>>;
  uniListCredits: Accessor<number>;
};

export const useSimulatorEffects = (params: SimulatorEffectsParams): void => {
  const {
    accreditation,
    enabledMap,
    hpcCompleted,
    ignorePrerequisites,
    parsedCourses,
    persist,
    program,
    setStatuses,
    setUniListCredits,
    statuses,
    uniListCredits,
  } = params;

  createEffect(
    () => statuses(),
    (s) => {
      const normalized = normalizeExclusiveProjectStatuses(s);
      if (normalized !== s) {
        setStatuses(normalized);
      }
    },
  );

  createEffect(
    () => [enabledMap(), statuses(), parsedCourses()] as const,
    ([enabled, s, courses]) => {
      const updates: Record<string, CourseStatus> = {};
      let changed = false;
      for (const c of courses) {
        const st = s[c.name];
        if (!st) continue;
        if (
          !((st.listened || st.passed) && enabled[c.name] === false) ||
          getExclusiveProjectBlocker(s, c.name)
        ) {
          continue;
        }

        updates[c.name] = { listened: false, passed: false };
        changed = true;
      }
      if (changed) {
        setStatuses((prev) => ({ ...prev, ...updates }));
      }
    },
  );

  createEffect(
    () =>
      [statuses(), persist(), accreditation(), params.rawCourses()] as const,
    ([s, save, acc, raw]) => {
      if (save) saveStatuses(acc, s, raw);
    },
  );

  createEffect(
    () => [accreditation(), persist()] as const,
    ([acc, save]) => {
      if (save) localStorage.setItem(STORAGE_KEY_ACC, acc);
    },
  );

  createEffect(
    () => [program(), persist()] as const,
    ([p, save]) => {
      if (save) localStorage.setItem(STORAGE_KEY_PROGRAM, p);
    },
  );

  createEffect(
    () => [hpcCompleted(), persist()] as const,
    ([value, save]) => {
      if (save) localStorage.setItem(STORAGE_KEY_HPC, String(value));
    },
  );

  createEffect(
    () => [ignorePrerequisites(), persist()] as const,
    ([value, save]) => {
      if (save) {
        localStorage.setItem(STORAGE_KEY_IGNORE_PREREQUISITES, String(value));
      }
    },
  );

  createEffect(
    () => [uniListCredits(), persist()] as const,
    ([credits, save]) => {
      const normalized = clampUniListCredits(credits);
      if (normalized !== credits) {
        setUniListCredits(normalized);
        return;
      }
      if (save) saveUniListCredits(normalized);
    },
  );
};
