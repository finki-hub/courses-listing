import { batch, createMemo, createSignal } from 'solid-js';

import {
  isBrowserStorageAvailable,
  readBrowserStorage,
  writeBrowserStorage,
} from '@/lib/safe-storage';
import {
  DEFAULT_PROGRAM,
  getElectiveCreditsPerLevel,
  loadStatuses,
} from '@/lib/simulator';
import {
  getSimulatorProgress,
  needsSimulatorSetup,
  STORAGE_KEY_SETUP,
} from '@/lib/simulator-setup';
import { type SimulatorMode } from '@/lib/simulator-url-state';
import {
  type Accreditation,
  type CourseLevelFilter,
  type CourseRaw,
  getStudyPrograms,
  type SeasonFilter,
} from '@/types/course';

import { useNextCourses } from './use-next-courses';
import { useSharedPreview } from './use-shared-preview';
import { useSimulatorActions } from './use-simulator-actions';
import { useSimulatorCourses } from './use-simulator-courses';
import { useSimulatorEffects } from './use-simulator-effects';
import { getInitialSimulatorState } from './use-simulator-initial-state';
import { useSimulatorShare } from './use-simulator-share';
import { useSimulatorState } from './use-simulator-state';
import { useSimulatorView } from './use-simulator-view';
import { useStudyPlan } from './use-study-plan';

// Whether the first-visit setup still has to be shown, and how to finish it.
const useSimulatorSetup = (hasShareLink: boolean) => {
  const [setupPending, setSetupPending] = createSignal(
    needsSimulatorSetup({
      hasShareLink,
      read: readBrowserStorage,
      storageAvailable: isBrowserStorageAvailable(),
    }),
  );
  const completeSetup = () => {
    writeBrowserStorage(STORAGE_KEY_SETUP, 'true');
    setSetupPending(false);
  };
  return { completeSetup, setupPending };
};

// All of the simulator's state, derived data and actions.
export const useEnrollmentSimulator = (courses: () => CourseRaw[]) => {
  const initialState = getInitialSimulatorState();
  const { completeSetup, setupPending } = useSimulatorSetup(
    initialState.shared !== undefined,
  );

  const [accreditation, setAccreditation] = createSignal<Accreditation>(
    initialState.accreditation,
  );
  const [program, setProgram] = createSignal(initialState.program);
  const [showOnlyEnabled, setShowOnlyEnabled] = createSignal(
    initialState.showOnlyEnabled,
  );
  const [seasonFilter, setSeasonFilter] = createSignal<SeasonFilter>(
    initialState.seasonFilter,
  );
  const [levelFilter, setLevelFilter] = createSignal<CourseLevelFilter>(
    initialState.view.level,
  );
  const [hpcCompleted, setHpcCompleted] = createSignal(
    initialState.hpcCompleted,
  );
  const [uniListCredits, setUniListCredits] = createSignal(
    initialState.uniListCredits,
  );
  const [mode, setMode] = createSignal<SimulatorMode>(initialState.view.mode);

  const { courseInfoMap, electiveCourses, parsedCourses } = useSimulatorCourses(
    courses,
    accreditation,
    program,
  );

  const [statuses, setStatuses] = createSignal(
    initialState.resolveStatuses(parsedCourses()),
  );

  const planRef: { reload?: (acc: Accreditation) => void } = {}; // set below
  const preview = useSharedPreview({
    courses: parsedCourses,
    onDiscard: (saved) => {
      setAccreditation(saved.accreditation);
      setProgram(saved.program);
      setHpcCompleted(saved.hpcCompleted);
      setUniListCredits(saved.uniListCredits);
      setStatuses(loadStatuses(saved.accreditation, courses()));
      planRef.reload?.(saved.accreditation);
      setSeasonFilter(null);
      setShowOnlyEnabled(false);
    },
    shared: initialState.shared,
  });
  const state = useSimulatorState({
    courseInfoMap,
    electiveCourses,
    hpcCompleted,
    parsedCourses,
    statuses,
    uniListCredits,
  });

  useSimulatorEffects({
    accreditation,
    enabledMap: state.enabledMap,
    hpcCompleted,
    parsedCourses,
    persist: preview.persist,
    program,
    rawCourses: courses,
    setStatuses,
    setUniListCredits,
    statuses,
    uniListCredits,
  });

  const plan = useStudyPlan({
    accreditation,
    courseInfoMap,
    courses: parsedCourses,
    initialPlan: initialState.resolvePlan(parsedCourses()),
    persist: preview.persist,
    rawCourses: courses,
    statuses,
    totalCredits: state.totalCredits,
  });
  planRef.reload = plan.reload;

  const { copyShareUrl } = useSimulatorShare({
    accreditation,
    courses: parsedCourses,
    hpcCompleted,
    plan: plan.plan,
    program,
    seasonFilter,
    showOnlyEnabled,
    statuses,
    uniListCredits,
  });

  const view = useSimulatorView({
    courses: parsedCourses,
    enabledMap: state.enabledMap,
    initial: initialState.view,
    levelFilter,
    mode,
    seasonFilter,
    showOnlyEnabled,
  });

  const actions = useSimulatorActions({
    accreditation,
    courses: parsedCourses,
    enabledMap: state.enabledMap,
    hpcCompleted,
    program,
    setHpcCompleted,
    setStatuses,
    setUniListCredits,
    statuses,
    uniListCredits,
  });
  const next = useNextCourses({
    courses: parsedCourses,
    enabledMap: state.enabledMap,
    fullLevels: state.fullLevels,
    levelFilter,
    seasonFilter,
    statuses,
  });

  // Untaken, unplanned courses matching the filters, for the plan view.
  const planCandidates = createMemo(() =>
    view
      .groups()
      .flatMap((group) => group.courses)
      .filter((course) => {
        const status = statuses()[course.name];
        return (
          !status?.listened &&
          !status?.passed &&
          plan.plan()[course.name] === undefined
        );
      }),
  );

  const progress = createMemo(() =>
    getSimulatorProgress(
      state.totalCredits(),
      getElectiveCreditsPerLevel(parsedCourses(), statuses()),
    ),
  );

  const switchAccreditation = (acc: Accreditation) => {
    batch(() => {
      if (preview.previewing()) preview.discard();
      setAccreditation(acc);
      setProgram(getStudyPrograms(acc)[0] ?? DEFAULT_PROGRAM);
      setStatuses(loadStatuses(acc, courses()));
      plan.reload(acc);
    });
  };

  return {
    accreditation,
    actions,
    completeSetup,
    copyShareUrl,
    courses: parsedCourses,
    hpcCompleted,
    levelFilter,
    mode,
    next,
    plan,
    planCandidates,
    preview,
    program,
    progress,
    seasonFilter,
    setHpcCompleted,
    setLevelFilter,
    setMode,
    setProgram,
    setSeasonFilter,
    setShowOnlyEnabled,
    setUniListCredits,
    setupPending,
    showOnlyEnabled,
    state,
    statuses,
    switchAccreditation,
    uniListCredits,
    view,
  };
};
