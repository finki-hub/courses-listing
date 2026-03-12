import { type Accessor, createEffect, on, type Setter } from 'solid-js';

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
  STORAGE_KEY_PROGRAM,
} from '@/lib/simulator';
import { type Accreditation } from '@/types/course';

type SimulatorEffectsParams = {
  accreditation: Accessor<Accreditation>;
  enabledMap: Accessor<Record<string, boolean>>;
  hpcCompleted: Accessor<boolean>;
  parsedCourses: Accessor<SimulatorCourse[]>;
  program: Accessor<string>;
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
    parsedCourses,
    program,
    setStatuses,
    setUniListCredits,
    statuses,
    uniListCredits,
  } = params;

  createEffect(
    on(statuses, (s) => {
      const normalized = normalizeExclusiveProjectStatuses(s);
      if (normalized !== s) {
        setStatuses(normalized);
      }
    }),
  );

  createEffect(
    on([enabledMap, statuses], ([enabled, s]) => {
      const updates: Record<string, CourseStatus> = {};
      let changed = false;
      for (const c of parsedCourses()) {
        const st = s[c.name];
        if (!st) continue;
        if (
          (st.listened || st.passed) &&
          enabled[c.name] === false &&
          !getExclusiveProjectBlocker(s, c.name)
        ) {
          updates[c.name] = { listened: false, passed: false };
          changed = true;
        }
      }
      if (changed) {
        setStatuses((prev) => ({ ...prev, ...updates }));
      }
    }),
  );

  createEffect(
    on(statuses, (s) => {
      saveStatuses(accreditation(), s);
    }),
  );

  createEffect(
    on(accreditation, (acc) => {
      localStorage.setItem(STORAGE_KEY_ACC, acc);
    }),
  );

  createEffect(
    on(program, (p) => {
      localStorage.setItem(STORAGE_KEY_PROGRAM, p);
    }),
  );

  createEffect(
    on(hpcCompleted, (value) => {
      localStorage.setItem(STORAGE_KEY_HPC, String(value));
    }),
  );

  createEffect(
    on(uniListCredits, (credits) => {
      const normalized = clampUniListCredits(credits);
      if (normalized !== credits) {
        setUniListCredits(normalized);
        return;
      }
      saveUniListCredits(normalized);
    }),
  );
};
