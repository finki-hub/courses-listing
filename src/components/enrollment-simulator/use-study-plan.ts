import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
} from 'solid-js';

import { type CourseInfo, type CourseStatus } from '@/lib/prerequisite';
import { type SimulatorCourse } from '@/lib/simulator';
import {
  evaluatePlan,
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
  const evaluation = createMemo(() =>
    evaluatePlan({
      baseCredits: params.totalCredits(),
      courseInfoMap: params.courseInfoMap(),
      courses: params.courses(),
      plan: plan(),
      statuses: params.statuses(),
    }),
  );

  createEffect(
    on([plan, params.persist], ([value, save]) => {
      if (save) savePlan(params.accreditation(), value, params.rawCourses());
    }),
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

  return { addToPlan, evaluation, plan, reload, setSemester, start };
};
