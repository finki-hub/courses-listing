import { type Accessor, createEffect, on, type Setter } from 'solid-js';

import { type CourseStatus } from '@/lib/prerequisite';
import {
  type SimulatorCourse,
  toggleListenedStatus,
  togglePassedStatus,
} from '@/lib/simulator';
import {
  type BulkStatus,
  getBulkTargets,
  markCourses,
} from '@/lib/simulator-view';

import { useUndoableAction } from './undo-notice';

type SimulatorActionsParams = {
  accreditation: Accessor<string>;
  courses: Accessor<SimulatorCourse[]>;
  enabledMap: Accessor<Record<string, boolean>>;
  hpcCompleted: Accessor<boolean>;
  program: Accessor<string>;
  setHpcCompleted: Setter<boolean>;
  setStatuses: Setter<Record<string, CourseStatus>>;
  setUniListCredits: Setter<number>;
  statuses: Accessor<Record<string, CourseStatus>>;
  uniListCredits: Accessor<number>;
};

// The ways the student changes their statuses, including an undoable reset.
export const useSimulatorActions = (params: SimulatorActionsParams) => {
  const undoable = useUndoableAction();

  // A reset's snapshot belongs to the accreditation and program it was made in.
  createEffect(
    on([params.accreditation, params.program], undoable.dismiss, {
      defer: true,
    }),
  );

  const toggleListened = (name: string) => {
    params.setStatuses((prev) => toggleListenedStatus(prev, name));
  };

  const togglePassed = (name: string) => {
    params.setStatuses((prev) => togglePassedStatus(prev, name));
  };

  // Acts on the whole semester, not only the courses the filters show.
  const bulkMark = (semester: number, target: BulkStatus) => {
    const names = getBulkTargets(
      params.courses().filter((course) => course.semester === semester),
      { enabledMap: params.enabledMap(), statuses: params.statuses() },
      target,
    );
    params.setStatuses((prev) => markCourses(prev, names, target));
  };

  const reset = () => {
    const staticSnapshot = {
      hpc: params.hpcCompleted(),
      statuses: params.statuses(),
      uniList: params.uniListCredits(),
    };
    params.setStatuses({});
    params.setHpcCompleted(false);
    params.setUniListCredits(0);
    undoable.offer(() => {
      params.setStatuses(staticSnapshot.statuses);
      params.setHpcCompleted(staticSnapshot.hpc);
      params.setUniListCredits(staticSnapshot.uniList);
    });
  };

  return {
    bulkMark,
    reset,
    toggleListened,
    togglePassed,
    UndoNotice: undoable.Notice,
  };
};
