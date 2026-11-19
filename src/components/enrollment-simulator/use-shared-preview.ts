import { type Accessor, batch, createSignal } from 'solid-js';

import { writeBrowserStorage } from '@/lib/safe-storage';
import { loadStatuses, type SimulatorCourse } from '@/lib/simulator';
import { STORAGE_KEY_SETUP } from '@/lib/simulator-setup';
import {
  clearSimulatorShareParam,
  sharedStateConflicts,
  type SimulatorShareState,
} from '@/lib/simulator-share';
import { loadPlan } from '@/lib/study-plan';

import {
  getSavedSimulatorSettings,
  type SavedSimulatorSettings,
} from './use-simulator-initial-state';

type SharedPreviewParams = {
  courses: Accessor<SimulatorCourse[]>;
  /** Puts the saved settings back in place of the shared ones. */
  onDiscard: (saved: SavedSimulatorSettings) => void;
  shared: SimulatorShareState | undefined;
};

const hasProgress = (accreditation: SavedSimulatorSettings['accreditation']) =>
  Object.values(loadStatuses(accreditation)).some(
    (status) => status.listened || status.passed,
  ) || Object.keys(loadPlan(accreditation)).length > 0;

// Whether taking over the link would replace progress or settings the
// student saved, so it has to be previewed first.
const wouldReplaceSaved = (
  courses: SimulatorCourse[],
  shared: SimulatorShareState,
): boolean => {
  const saved = getSavedSimulatorSettings();
  const settingsDiffer =
    saved.accreditation !== shared.accreditation ||
    saved.program !== shared.program ||
    saved.hpcCompleted !== shared.hpcCompleted ||
    saved.uniListCredits !== shared.uniListCredits;
  return (
    sharedStateConflicts(courses, shared, {
      plan: loadPlan(shared.accreditation),
      statuses: loadStatuses(shared.accreditation),
    }) ||
    (settingsDiffer && hasProgress(saved.accreditation))
  );
};

// The link is handled: setup is done and the link leaves the URL.
const finishSharedLink = () => {
  writeBrowserStorage(STORAGE_KEY_SETUP, 'true');
  clearSimulatorShareParam();
};

// A shared link that differs from saved progress opens as a preview, which
// saves nothing until the student keeps it. Otherwise it is taken over.
export const useSharedPreview = (params: SharedPreviewParams) => {
  const { shared } = params;
  const [previewing, setPreviewing] = createSignal(
    shared !== undefined && wouldReplaceSaved(params.courses(), shared),
  );
  if (shared && !previewing()) finishSharedLink();

  // Keeps the shared state as the student's own; saving resumes with it.
  const keep = () => {
    setPreviewing(false);
    finishSharedLink();
  };

  // Leaves the preview and brings back what the student saved.
  const discard = () => {
    const saved = getSavedSimulatorSettings();
    batch(() => {
      params.onDiscard(saved);
      setPreviewing(false);
    });
    finishSharedLink();
  };

  return { discard, keep, persist: () => !previewing(), previewing };
};
