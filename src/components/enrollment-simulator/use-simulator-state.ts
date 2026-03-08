import { type Accessor, createMemo } from 'solid-js';

import { type CourseInfo, type CourseStatus } from '@/lib/prerequisite';
import {
  computeEnabledMap,
  computeOverLimitInfo,
  computeReasonMap,
  DIPLOMA_THESIS_COURSE_NAME,
  GRADUATION_CREDITS_3YR,
  GRADUATION_CREDITS_4YR,
  type GraduationEligibility,
  HPC_CREDITS,
  isFourYearOnly,
  isRequired,
  type SimulatorCourse,
} from '@/lib/simulator';

type UseSimulatorStateParams = {
  courseInfoMap: Accessor<Map<string, CourseInfo>>;
  electiveCourses: Accessor<Set<string>>;
  hpcCompleted: Accessor<boolean>;
  parsedCourses: Accessor<SimulatorCourse[]>;
  statuses: Accessor<Record<string, CourseStatus>>;
};

export const useSimulatorState = (params: UseSimulatorStateParams) => {
  const {
    courseInfoMap,
    electiveCourses,
    hpcCompleted,
    parsedCourses,
    statuses,
  } = params;

  const totalCourses = createMemo(() => {
    const s = statuses();
    let enrolled = 0;
    let passed = 0;
    for (const c of parsedCourses()) {
      const st = s[c.name];
      if (st?.listened) enrolled++;
      if (st?.passed) passed++;
    }
    return { enrolled, passed };
  });

  const overLimitInfo = createMemo(() =>
    computeOverLimitInfo(parsedCourses(), statuses()),
  );

  const totalCredits = createMemo(() => {
    const s = statuses();
    let sum = 0;
    for (const c of parsedCourses()) {
      if (s[c.name]?.passed) sum += c.credits;
    }
    if (hpcCompleted()) sum += HPC_CREDITS;
    return sum - overLimitInfo().excessCredits;
  });

  const overLimitSet = createMemo(() => overLimitInfo().names);
  const overLimitLevels = createMemo(() => overLimitInfo().levels);
  const fullLevels = createMemo(() => overLimitInfo().fullLevels);

  const graduationInfo = createMemo(() => {
    const s = statuses();
    const missing3yr: string[] = [];
    const missing4yr: string[] = [];

    for (const c of parsedCourses()) {
      const state = c.programState;
      const required = isRequired(state);
      if (!required) continue;
      if (c.name === DIPLOMA_THESIS_COURSE_NAME) continue;
      if (s[c.name]?.passed) continue;
      const fourYearOnly = state ? isFourYearOnly(state) : false;
      if (!fourYearOnly) {
        missing3yr.push(c.name);
      }
      missing4yr.push(c.name);
    }
    return { missing3yr, missing4yr };
  });

  const graduationEligibility = createMemo((): GraduationEligibility => {
    const credits = totalCredits();
    const info = graduationInfo();
    const diplomaPassed =
      statuses()[DIPLOMA_THESIS_COURSE_NAME]?.passed ?? false;

    const credits3yr = credits >= GRADUATION_CREDITS_3YR;
    const credits4yr = credits >= GRADUATION_CREDITS_4YR;
    const canGrad3yr = credits3yr && info.missing3yr.length === 0;
    const canGrad4yr = credits4yr && info.missing4yr.length === 0;
    const graduated3yr = canGrad3yr && diplomaPassed;
    const graduated4yr = canGrad4yr && diplomaPassed;

    return {
      canGrad3yr,
      canGrad4yr,
      credits3yr,
      credits4yr,
      graduated3yr,
      graduated4yr,
    };
  });

  const enabledMap = createMemo(() =>
    computeEnabledMap({
      courseInfoMap: courseInfoMap(),
      courses: parsedCourses(),
      statuses: statuses(),
    }),
  );

  const reasonMap = createMemo(() =>
    computeReasonMap({
      courseInfoMap: courseInfoMap(),
      courses: parsedCourses(),
      electiveCourses: electiveCourses(),
      enabledMap: enabledMap(),
      fullLevels: fullLevels(),
      overLimitSet: overLimitSet(),
      statuses: statuses(),
      totalCredits: totalCredits(),
    }),
  );

  return {
    enabledMap,
    fullLevels,
    graduationEligibility,
    graduationInfo,
    overLimitLevels,
    overLimitSet,
    reasonMap,
    totalCourses,
    totalCredits,
  };
};
