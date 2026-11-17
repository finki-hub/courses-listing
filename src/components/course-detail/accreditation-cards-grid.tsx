import { createMemo, For } from 'solid-js';

import { AccreditationCard } from '@/components/accreditation-card';
import {
  type AccreditationDetails,
  canMergeAccreditationDetails,
  getAccreditationDetails,
  indexCoursesByName,
} from '@/lib/course-detail';
import { type Accreditation, type CourseRaw } from '@/types/course';

const ACCREDITATIONS: readonly Accreditation[] = ['2023', '2018'];

type AccreditationCardsGridProps = {
  course: CourseRaw;
  courses?: CourseRaw[];
  onOpenCourse?: (course: CourseRaw) => void;
};

// One card per accreditation, or a single card when they are the same.
export const AccreditationCardsGrid = (props: AccreditationCardsGridProps) => {
  const cards = createMemo<AccreditationDetails[][]>(() => {
    const details = ACCREDITATIONS.flatMap((accreditation) => {
      const entry = getAccreditationDetails(props.course, accreditation);
      return entry ? [entry] : [];
    });
    const [first, second] = details;
    return first && second && canMergeAccreditationDetails(first, second)
      ? [details]
      : details.map((entry) => [entry]);
  });

  const indexes = createMemo(
    () =>
      new Map(
        ACCREDITATIONS.map((accreditation) => [
          accreditation,
          indexCoursesByName(props.courses ?? [], accreditation),
        ]),
      ),
  );

  const getCourseNames = (accreditation: Accreditation) => [
    ...(indexes().get(accreditation)?.keys() ?? []),
  ];

  const openCourse = (accreditation: Accreditation, name: string) => {
    const course = indexes().get(accreditation)?.get(name);
    if (course) props.onOpenCourse?.(course);
  };

  return (
    <div class={`grid gap-4 ${cards().length > 1 ? 'sm:grid-cols-2' : ''}`}>
      <For each={cards()}>
        {(details) => (
          <AccreditationCard
            details={details}
            getCourseNames={getCourseNames}
            onOpenCourse={props.onOpenCourse ? openCourse : undefined}
          />
        )}
      </For>
    </div>
  );
};
