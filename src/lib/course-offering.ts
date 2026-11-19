import {
  type EnrollmentYears,
  getCurrentEnrollment,
  type SeasonResolver,
} from '@/lib/course-facts';
import {
  ACADEMIC_YEARS,
  type AcademicYear,
  type CourseRaw,
  getEnrollmentForYear,
} from '@/types/course';

// Whether a course had students in the latest year: if not, the year it last
// had some, or that it never did.
export type Offering =
  | { kind: 'current' }
  | { kind: 'last'; year: AcademicYear }
  | { kind: 'never' };

// The newest academic year in which the course had students.
export const getLastOfferedYear = (
  course: CourseRaw,
): AcademicYear | undefined =>
  ACADEMIC_YEARS.find((year) => getEnrollmentForYear(course, year) > 0);

export const getOffering = (
  course: CourseRaw,
  years: EnrollmentYears,
  getSeason?: SeasonResolver,
): Offering => {
  if (getCurrentEnrollment(course, years, getSeason) > 0) {
    return { kind: 'current' };
  }
  const year = getLastOfferedYear(course);
  return year === undefined ? { kind: 'never' } : { kind: 'last', year };
};

// "2022/2023" as "2022/23".
export const formatCompactYear = (year: string): string => {
  const [start, end] = year.split('/', 2);
  return start !== undefined && end !== undefined && end.length > 2
    ? `${start}/${end.slice(-2)}`
    : year;
};
