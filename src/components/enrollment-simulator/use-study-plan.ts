import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
} from 'solid-js';

import { type CourseInfo, type CourseStatus } from '@/lib/prerequisite';
import { type SimulatorCourse } from '@/lib/simulator';
import {
  evaluatePlan,
  fillRequiredCourses,
  getPlanOptions,
  getPlanStart,
  loadPlan,
  savePlan,
  setPlannedSemester,
  type StudyPlan,
} from '@/lib/study-plan';
import { type Accreditation, type CourseRaw } from '@/types/course';

type StudyPlanParams = {
  accreditation: Accessor<Accreditation>;
  courseInfoMap: Accessor<Map<string, CourseInfo>>;
  courses: Accessor<SimulatorCourse[]>;
  ignorePrerequisites: Accessor<boolean>;
  initialPlan: StudyPlan;
  /** False while a shared link is previewed, so the plan is not saved. */
  persist: Accessor<boolean>;
  /** Every course, to save the plan by course code. */
  rawCourses: Accessor<CourseRaw[]>;
  statuses: Accessor<Record<string, CourseStatus>>;
  totalCredits: Accessor<number>;
};

// The study plan: its state, persistence per accreditation and evaluation.
export const useStudyPlan = (params: StudyPlanParams) => {
  const [plan, setPlan] = createSignal<StudyPlan>(params.initialPlan);

  const start = createMemo(() =>
    getPlanStart(params.courses(), params.statuses()),
  );
  const context = () => ({
    baseCredits: params.totalCredits(),
    courseInfoMap: params.courseInfoMap(),
    courses: params.courses(),
    ignorePrerequisites: params.ignorePrerequisites(),
    plan: plan(),
    statuses: params.statuses(),
  });
  const evaluation = createMemo(() => evaluatePlan(context()));

  createEffect(
    () =>
      [
        plan(),
        params.persist(),
        params.accreditation(),
        params.rawCourses(),
      ] as const,
    ([value, save, accreditation, rawCourses]) => {
      if (save) savePlan(accreditation, value, rawCourses);
    },
  );

  const setSemester = (name: string, semester: number | undefined) => {
    setPlan((current) => setPlannedSemester(current, name, semester));
  };

  // Plans a course for the earliest semester that offers it.
  const addToPlan = (course: SimulatorCourse) => {
    setSemester(course.name, getPlanOptions(course, start())[0]);
  };

  const reload = (accreditation: Accreditation) => {
    setPlan(loadPlan(accreditation, params.rawCourses()));
  };

  // Plans the remaining required courses; returns how many were added and
  // how to undo it.
  const fillRequired = (): { added: number; undo: () => void } => {
    const previous = plan();
    const filled = fillRequiredCourses(context());
    setPlan(filled);
    return {
      added: Object.keys(filled).length - Object.keys(previous).length,
      undo: () => setPlan(previous),
    };
  };

  return {
    addToPlan,
    evaluation,
    fillRequired,
    plan,
    reload,
    setSemester,
    start,
  };
};
