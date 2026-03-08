import { createMemo } from 'solid-js';

import { type CourseInfo, parsePrerequisite } from '@/lib/prerequisite';
import {
  buildSimulatorCourse,
  compareBySemesterAndName,
  isRequired,
  pruneElectivePrereqs,
  type SimulatorCourse,
} from '@/lib/simulator';
import {
  type Accreditation,
  type CourseRaw,
  getAccreditationInfo,
} from '@/types/course';

export const useSimulatorCourses = (
  getCourses: () => CourseRaw[],
  getAccreditation: () => Accreditation,
  getProgram: () => string,
) => {
  const simulatorCourses = createMemo<SimulatorCourse[]>(() => {
    const acc = getAccreditation();
    const prog = getProgram();
    const courses: SimulatorCourse[] = [];

    for (const raw of getCourses()) {
      const info = getAccreditationInfo(raw, acc);
      if (!info) continue;
      const course = buildSimulatorCourse({ acc, info, prog, raw });
      if (course) courses.push(course);
    }

    courses.sort(compareBySemesterAndName);
    return courses;
  });

  const electiveCourses = createMemo(() => {
    const set = new Set<string>();
    for (const c of simulatorCourses()) {
      if (c.programState && !isRequired(c.programState)) {
        set.add(c.name);
      }
    }
    return set;
  });

  const parsedCourses = createMemo<SimulatorCourse[]>(() => {
    const list = simulatorCourses();
    const names = list.map((c) => c.name);
    const electives = electiveCourses();
    return list.map((c) => {
      const rawPrereqNode = parsePrerequisite(c.prerequisite, names);
      return {
        ...c,
        prereqNode: pruneElectivePrereqs(rawPrereqNode, electives),
        rawPrereqNode,
      };
    });
  });

  const courseInfoMap = createMemo<Map<string, CourseInfo>>(() => {
    const map = new Map<string, CourseInfo>();
    for (const c of parsedCourses()) {
      map.set(c.name, {
        credits: c.credits,
        name: c.name,
        semester: c.semester,
      });
    }
    return map;
  });

  return { courseInfoMap, electiveCourses, parsedCourses };
};
