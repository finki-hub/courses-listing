import { type Accessor, type Setter } from 'solid-js';

import { type CourseStatus } from '@/lib/prerequisite';
import { toggleListenedStatus, togglePassedStatus } from '@/lib/simulator';
import {
  type BulkStatus,
  getBulkTargets,
  markCourses,
  type SemesterGroup,
} from '@/lib/simulator-view';

import { useUndoableAction } from './undo-notice';

type SimulatorActionsParams = {
  enabledMap: Accessor<Record<string, boolean>>;
  hpcCompleted: Accessor<boolean>;
  setHpcCompleted: Setter<boolean>;
  setStatuses: Setter<Record<string, CourseStatus>>;
  setUniListCredits: Setter<number>;
  statuses: Accessor<Record<string, CourseStatus>>;
  uniListCredits: Accessor<number>;
};

// The ways the student changes their statuses, including an undoable reset.
export const useSimulatorActions = (params: SimulatorActionsParams) => {
  const undoable = useUndoableAction();

  const toggleListened = (name: string) => {
    params.setStatuses((prev) => toggleListenedStatus(prev, name));
  };

  const togglePassed = (name: string) => {
    params.setStatuses((prev) => togglePassedStatus(prev, name));
  };

  const bulkMark = (group: SemesterGroup, target: BulkStatus) => {
    const names = getBulkTargets(
      group.courses,
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
