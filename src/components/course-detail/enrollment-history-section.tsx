import { Show } from 'solid-js';

import type { CourseRaw } from '@/types/course';

import { Badge } from '@/components/ui/badge';
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
      <Show
        fallback={
          <div class="rounded-lg border border-dashed bg-muted/20 p-4">
            <div class="font-medium">Нема достапни историски податоци</div>
            <div class="text-muted-foreground mt-1 text-sm">
              За овој предмет моментално нема години со внесен број на слушачи.
            </div>
          </div>
        }
        when={metrics().entries.length > 0}
      >
        <EnrollmentSummary metrics={metrics()} />
        <EnrollmentHistoryTable metrics={metrics()} />
      </Show>
    </div>
  );
};
