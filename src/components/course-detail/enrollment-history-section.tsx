import type { CourseRaw } from '@/types/course';

import { buildEnrollmentMetrics } from '@/lib/course-enrollment';

import { EnrollmentHistoryTable } from './enrollment-history-table';
import { EnrollmentSummary } from './enrollment-summary';

const SECTION_HEADING_CLASS =
  'text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide';

type EnrollmentHistorySectionProps = {
  course: CourseRaw;
};

export const EnrollmentHistorySection = (
  props: EnrollmentHistorySectionProps,
) => {
  const metrics = () => buildEnrollmentMetrics(props.course);

  return (
    <div>
      <h4 class={`${SECTION_HEADING_CLASS} mb-2`}>Број на запишани студенти</h4>
      <EnrollmentSummary metrics={metrics()} />
      <EnrollmentHistoryTable metrics={metrics()} />
    </div>
  );
};
