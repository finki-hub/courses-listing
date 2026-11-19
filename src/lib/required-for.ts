import {
  buildPrerequisiteGraph,
  type GraphCourse,
} from '@/lib/prerequisite-graph';
import { compareBySemesterAndName } from '@/lib/simulator';
import {
  type Accreditation,
  type CourseRaw,
  getAccreditationInfo,
} from '@/types/course';

/**
 * For each course of an accreditation, the courses whose prerequisite names
 * it, in semester and name order. Built from the prerequisite graph.
 *
 * @param courses - All undergraduate courses
 * @param accreditation - The accreditation whose prerequisites to read
 * @returns Names of the courses that need each course, by its name
 */
export const buildRequiredFor = (
  courses: readonly CourseRaw[],
  accreditation: Accreditation,
): ReadonlyMap<string, readonly string[]> => {
  // Courses by the name their accreditation's prerequisites write.
  const graphCourses = new Map<string, GraphCourse>();
  for (const course of courses) {
    const info = getAccreditationInfo(course, accreditation);
    if (!info) continue;
    const name = info.name ?? course.name;
    const semester = Number.parseInt(info.semester ?? '', 10);
    graphCourses.set(name, {
      name,
      prerequisite: info.prerequisite,
      semester: Number.isNaN(semester) ? 0 : semester,
    });
  }
  const { unlocks } = buildPrerequisiteGraph(graphCourses.values().toArray());
  return new Map(
    [...unlocks].map(([name, needing]) => [
      name,
      needing
        .flatMap((other) => {
          const found = graphCourses.get(other);
          return found ? [found] : [];
        })
        .toSorted(compareBySemesterAndName)
        .map((found) => found.name),
    ]),
  );
};
